import Foundation

enum IntegrationServiceError: Error, LocalizedError {
  case missingGoogleConfiguration
  case missingGoogleSession
  case invalidOAuthCode
  case invalidResponse
  case unsupportedResponseStatus(Int, String)
  case missingGitHubToken

  var errorDescription: String? {
    switch self {
    case .missingGoogleConfiguration:
      return "Google OAuth configuration is missing."
    case .missingGoogleSession:
      return "Google session is missing. Connect Google first."
    case .invalidOAuthCode:
      return "OAuth authorization code is invalid."
    case .invalidResponse:
      return "Integration service returned an invalid response."
    case .unsupportedResponseStatus(let status, let body):
      return "Integration request failed (\(status)): \(body)"
    case .missingGitHubToken:
      return "GitHub token is missing."
    }
  }
}

typealias IntegrationRequestHandler = @Sendable (URLRequest) async throws -> (Data, HTTPURLResponse)

enum URLSessionIntegrationClient {
  static let shared: IntegrationRequestHandler = { request in
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse else {
      throw IntegrationServiceError.invalidResponse
    }
    return (data, httpResponse)
  }
}

actor GoogleIntegrationService {
  private let secretStore: KeychainSecretStore
  private let requestHandler: IntegrationRequestHandler
  private let sessionKey = "integrations.google.session"
  private var configuration: GoogleOAuthConfiguration?
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()

  init(
    configuration: GoogleOAuthConfiguration? = GoogleOAuthConfiguration.fromEnvironment(),
    secretStore: KeychainSecretStore = KeychainSecretStore(service: "com.serenity.macos.integrations"),
    requestHandler: @escaping IntegrationRequestHandler = URLSessionIntegrationClient.shared
  ) {
    self.configuration = configuration
    self.secretStore = secretStore
    self.requestHandler = requestHandler
    encoder.dateEncodingStrategy = .iso8601
    decoder.dateDecodingStrategy = .iso8601
  }

  func updateConfiguration(_ configuration: GoogleOAuthConfiguration) {
    self.configuration = configuration
  }

  func currentConfiguration() -> GoogleOAuthConfiguration? {
    configuration
  }

  func authorizationURL(state: String = UUID().uuidString) throws -> URL {
    guard let configuration else {
      throw IntegrationServiceError.missingGoogleConfiguration
    }

    var components = URLComponents(url: configuration.authBaseURL, resolvingAgainstBaseURL: false)
    components?.queryItems = [
      URLQueryItem(name: "client_id", value: configuration.clientID),
      URLQueryItem(name: "redirect_uri", value: configuration.redirectURI),
      URLQueryItem(name: "response_type", value: "code"),
      URLQueryItem(name: "access_type", value: "offline"),
      URLQueryItem(name: "prompt", value: "consent"),
      URLQueryItem(name: "scope", value: configuration.scopes.joined(separator: " ")),
      URLQueryItem(name: "state", value: state),
    ]

    guard let url = components?.url else {
      throw IntegrationServiceError.invalidResponse
    }
    return url
  }

  func connectWithToken(
    accessToken: String,
    refreshToken: String?,
    expiresAt: Date?,
    userEmail: String?
  ) throws -> GoogleIntegrationSession {
    let session = GoogleIntegrationSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
      userEmail: userEmail,
      connectedAt: Date()
    )
    try saveSession(session)
    return session
  }

  func exchangeAuthorizationCode(_ code: String) async throws -> GoogleIntegrationSession {
    let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedCode.isEmpty else {
      throw IntegrationServiceError.invalidOAuthCode
    }
    guard let configuration else {
      throw IntegrationServiceError.missingGoogleConfiguration
    }

    var request = URLRequest(url: configuration.tokenURL)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

    let body = URLQueryItemEncoder.encode([
      "client_id": configuration.clientID,
      "client_secret": configuration.clientSecret,
      "redirect_uri": configuration.redirectURI,
      "grant_type": "authorization_code",
      "code": trimmedCode,
    ])
    request.httpBody = body.data(using: .utf8)

    let (data, response) = try await requestHandler(request)
    guard 200..<300 ~= response.statusCode else {
      throw IntegrationServiceError.unsupportedResponseStatus(response.statusCode, String(data: data, encoding: .utf8) ?? "")
    }

    let token = try decoder.decode(GoogleTokenResponse.self, from: data)
    let userEmail: String?
    do {
      userEmail = try await fetchGoogleUserEmail(accessToken: token.accessToken)
    } catch {
      userEmail = nil
    }

    let expiresAt = token.expiresIn.map { Date().addingTimeInterval(TimeInterval($0)) }
    let session = GoogleIntegrationSession(
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: expiresAt,
      userEmail: userEmail,
      connectedAt: Date()
    )
    try saveSession(session)
    return session
  }

  func currentSession() throws -> GoogleIntegrationSession? {
    guard let raw = try secretStore.secret(for: sessionKey),
          let data = raw.data(using: .utf8)
    else {
      return nil
    }

    return try decoder.decode(GoogleIntegrationSession.self, from: data)
  }

  func disconnect() throws {
    try secretStore.deleteSecret(for: sessionKey)
  }

  func syncCalendarTasks(
    existingTasks: [TaskEntity],
    existingProjects: [ProjectEntity],
    rangeDays: Int = 7
  ) async throws -> GoogleCalendarSyncPayload {
    guard let session = try currentSession() else {
      throw IntegrationServiceError.missingGoogleSession
    }
    guard let configuration else {
      throw IntegrationServiceError.missingGoogleConfiguration
    }

    let now = Date()
    let endDate = Calendar.current.date(byAdding: .day, value: max(1, rangeDays), to: now) ?? now
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]

    var components = URLComponents(url: configuration.calendarEventsURL, resolvingAgainstBaseURL: false)
    components?.queryItems = [
      URLQueryItem(name: "singleEvents", value: "true"),
      URLQueryItem(name: "orderBy", value: "startTime"),
      URLQueryItem(name: "timeMin", value: formatter.string(from: now)),
      URLQueryItem(name: "timeMax", value: formatter.string(from: endDate)),
      URLQueryItem(name: "maxResults", value: "50"),
    ]

    guard let url = components?.url else {
      throw IntegrationServiceError.invalidResponse
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    let (data, response) = try await requestHandler(request)
    guard 200..<300 ~= response.statusCode else {
      throw IntegrationServiceError.unsupportedResponseStatus(response.statusCode, String(data: data, encoding: .utf8) ?? "")
    }

    let payload = try decoder.decode(GoogleCalendarEventsResponse.self, from: data)
    let project = existingProjects.first(where: { $0.name.lowercased() == "google calendar" && !$0.archived })
      ?? ProjectEntity(
        id: "google-calendar-project",
        name: "Google Calendar",
        description: "Synced calendar events",
        color: "#4285F4",
        icon: "calendar",
        createdAt: now,
        updatedAt: now,
        archived: false,
        userId: nil
      )

    let existingEventIDs = Set(
      existingTasks
        .flatMap(\.tags)
        .filter { $0.hasPrefix("google-event-") }
    )

    let importedTasks = payload.items.compactMap { event -> TaskEntity? in
      guard let eventID = event.id,
            let title = event.summary,
            !title.isEmpty
      else {
        return nil
      }

      let eventTag = "google-event-\(eventID)"
      if existingEventIDs.contains(eventTag) {
        return nil
      }

      let dueDate = event.start.parsedDate
      return TaskEntity(
        id: "google-event-\(eventID)",
        title: title,
        description: event.description,
        completed: event.status == "cancelled",
        completedAt: event.status == "cancelled" ? now : nil,
        priority: .medium,
        dueDate: dueDate,
        projectId: project.id,
        tags: ["google-calendar", eventTag],
        createdAt: now,
        updatedAt: now,
        subtasks: [],
        recurring: nil,
        userId: nil
      )
    }

    return GoogleCalendarSyncPayload(
      tasks: importedTasks,
      project: existingProjects.contains(where: { $0.id == project.id }) ? nil : project,
      importedCount: importedTasks.count
    )
  }

  private func fetchGoogleUserEmail(accessToken: String) async throws -> String? {
    guard let configuration else { return nil }

    var request = URLRequest(url: configuration.userInfoURL)
    request.httpMethod = "GET"
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    let (data, response) = try await requestHandler(request)
    guard 200..<300 ~= response.statusCode else {
      return nil
    }

    let profile = try decoder.decode(GoogleUserInfoResponse.self, from: data)
    return profile.email
  }

  private func saveSession(_ session: GoogleIntegrationSession) throws {
    let data = try encoder.encode(session)
    guard let raw = String(data: data, encoding: .utf8) else {
      throw IntegrationServiceError.invalidResponse
    }

    try secretStore.setSecret(raw, for: sessionKey)
  }
}

actor GitHubIntegrationService {
  private let secretStore: KeychainSecretStore
  private let requestHandler: IntegrationRequestHandler
  private let tokensKey = "integrations.github.tokens"
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()

  init(
    secretStore: KeychainSecretStore = KeychainSecretStore(service: "com.serenity.macos.integrations"),
    requestHandler: @escaping IntegrationRequestHandler = URLSessionIntegrationClient.shared
  ) {
    self.secretStore = secretStore
    self.requestHandler = requestHandler
    encoder.dateEncodingStrategy = .iso8601
    decoder.dateDecodingStrategy = .iso8601
  }

  func listTokens() throws -> [GitHubTokenRecord] {
    try loadTokens()
  }

  func addToken(_ token: String, displayName: String?) async throws -> [GitHubTokenRecord] {
    let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      throw IntegrationServiceError.missingGitHubToken
    }

    let username = try await validateTokenAndFetchUsername(trimmed)
    var tokens = try loadTokens()

    let now = Date()
    let record = GitHubTokenRecord(
      id: UUID().uuidString,
      token: trimmed,
      displayName: displayName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? displayName! : "\(username) Token",
      username: username,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastValidatedAt: now,
      lastSyncAt: nil
    )
    tokens.append(record)
    try saveTokens(tokens)
    return tokens
  }

  func removeToken(id: String) throws -> [GitHubTokenRecord] {
    var tokens = try loadTokens()
    tokens.removeAll { $0.id == id }
    try saveTokens(tokens)
    return tokens
  }

  func toggleTokenActive(id: String) throws -> [GitHubTokenRecord] {
    var tokens = try loadTokens()
    guard let index = tokens.firstIndex(where: { $0.id == id }) else {
      return tokens
    }

    tokens[index].isActive.toggle()
    tokens[index].updatedAt = Date()
    try saveTokens(tokens)
    return tokens
  }

  func syncGitHubPullRequests(
    existingTasks: [TaskEntity],
    existingProjects: [ProjectEntity],
    lookbackDays: Int = 14
  ) async throws -> GitHubSyncPayload {
    var tokens = try loadTokens().filter(\.isActive)
    guard !tokens.isEmpty else {
      return GitHubSyncPayload(tasks: [], project: nil, importedCount: 0)
    }

    let now = Date()
    let lookbackDate = Calendar.current.date(byAdding: .day, value: -max(1, lookbackDays), to: now) ?? now
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyy-MM-dd"
    let dateString = formatter.string(from: lookbackDate)

    let project = existingProjects.first(where: { $0.name.lowercased() == "github" && !$0.archived })
      ?? ProjectEntity(
        id: "github-project",
        name: "GitHub",
        description: "Synced pull requests and issues",
        color: "#333333",
        icon: "chevron.left.forwardslash.chevron.right",
        createdAt: now,
        updatedAt: now,
        archived: false,
        userId: nil
      )

    let existingPRTags = Set(
      existingTasks
        .flatMap(\.tags)
        .filter { $0.hasPrefix("github-pr-") }
    )

    var importedTasks: [TaskEntity] = []
    var seenPRIDs: Set<Int64> = []

    for tokenIndex in tokens.indices {
      let tokenRecord = tokens[tokenIndex]
      let query = "is:pr author:\(tokenRecord.username) updated:>=\(dateString)"

      var components = URLComponents(string: "https://api.github.com/search/issues")
      components?.queryItems = [
        URLQueryItem(name: "q", value: query),
        URLQueryItem(name: "per_page", value: "50"),
        URLQueryItem(name: "sort", value: "updated"),
        URLQueryItem(name: "order", value: "desc"),
      ]

      guard let url = components?.url else {
        continue
      }

      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.setValue("Bearer \(tokenRecord.token)", forHTTPHeaderField: "Authorization")
      request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
      request.setValue("2022-11-28", forHTTPHeaderField: "X-GitHub-Api-Version")

      let (data, response) = try await requestHandler(request)
      guard 200..<300 ~= response.statusCode else {
        throw IntegrationServiceError.unsupportedResponseStatus(response.statusCode, String(data: data, encoding: .utf8) ?? "")
      }

      let payload = try decoder.decode(GitHubIssueSearchResponse.self, from: data)
      for item in payload.items {
        if seenPRIDs.contains(item.id) {
          continue
        }
        seenPRIDs.insert(item.id)

        let tag = "github-pr-\(item.id)"
        if existingPRTags.contains(tag) {
          continue
        }

        let task = TaskEntity(
          id: "github-pr-\(item.id)",
          title: item.title,
          description: [item.body ?? "", item.htmlURL].joined(separator: "\n\n"),
          completed: item.state.lowercased() != "open",
          completedAt: item.state.lowercased() != "open" ? now : nil,
          priority: .medium,
          dueDate: now,
          projectId: project.id,
          tags: ["github", "pull-request", tag],
          createdAt: item.createdAt,
          updatedAt: now,
          subtasks: [],
          recurring: nil,
          userId: nil
        )
        importedTasks.append(task)
      }

      tokens[tokenIndex].lastSyncAt = now
      tokens[tokenIndex].updatedAt = now
    }

    try saveTokens(tokens)
    return GitHubSyncPayload(
      tasks: importedTasks,
      project: existingProjects.contains(where: { $0.id == project.id }) ? nil : project,
      importedCount: importedTasks.count
    )
  }

  private func validateTokenAndFetchUsername(_ token: String) async throws -> String {
    var request = URLRequest(url: URL(string: "https://api.github.com/user")!)
    request.httpMethod = "GET"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
    request.setValue("2022-11-28", forHTTPHeaderField: "X-GitHub-Api-Version")

    let (data, response) = try await requestHandler(request)
    guard 200..<300 ~= response.statusCode else {
      throw IntegrationServiceError.unsupportedResponseStatus(response.statusCode, String(data: data, encoding: .utf8) ?? "")
    }

    let payload = try decoder.decode(GitHubUserResponse.self, from: data)
    return payload.login
  }

  private func loadTokens() throws -> [GitHubTokenRecord] {
    guard let raw = try secretStore.secret(for: tokensKey),
          let data = raw.data(using: .utf8)
    else {
      return []
    }

    return try decoder.decode([GitHubTokenRecord].self, from: data)
  }

  private func saveTokens(_ tokens: [GitHubTokenRecord]) throws {
    let data = try encoder.encode(tokens)
    guard let raw = String(data: data, encoding: .utf8) else {
      throw IntegrationServiceError.invalidResponse
    }

    try secretStore.setSecret(raw, for: tokensKey)
  }
}

private enum URLQueryItemEncoder {
  static func encode(_ values: [String: String]) -> String {
    values
      .map { key, value in
        let escapedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
        return "\(key)=\(escapedValue)"
      }
      .joined(separator: "&")
  }
}

private struct GoogleTokenResponse: Codable {
  let accessToken: String
  let refreshToken: String?
  let expiresIn: Int?

  enum CodingKeys: String, CodingKey {
    case accessToken = "access_token"
    case refreshToken = "refresh_token"
    case expiresIn = "expires_in"
  }
}

private struct GoogleUserInfoResponse: Codable {
  let email: String?
}

private struct GoogleCalendarEventsResponse: Codable {
  let items: [GoogleCalendarEvent]
}

private struct GoogleCalendarEvent: Codable {
  let id: String?
  let status: String
  let summary: String?
  let description: String?
  let start: GoogleCalendarEventDate
}

private struct GoogleCalendarEventDate: Codable {
  let dateTime: String?
  let date: String?

  var parsedDate: Date? {
    if let dateTime,
       let parsed = ISO8601DateFormatter().date(from: dateTime) {
      return parsed
    }

    if let date {
      let formatter = DateFormatter()
      formatter.locale = Locale(identifier: "en_US_POSIX")
      formatter.timeZone = TimeZone(secondsFromGMT: 0)
      formatter.dateFormat = "yyyy-MM-dd"
      return formatter.date(from: date)
    }

    return nil
  }
}

private struct GitHubUserResponse: Codable {
  let login: String
}

private struct GitHubIssueSearchResponse: Codable {
  let items: [GitHubIssue]
}

private struct GitHubIssue: Codable {
  let id: Int64
  let title: String
  let body: String?
  let state: String
  let htmlURL: String
  let createdAt: Date

  enum CodingKeys: String, CodingKey {
    case id
    case title
    case body
    case state
    case htmlURL = "html_url"
    case createdAt = "created_at"
  }
}
