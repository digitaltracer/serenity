import Foundation

struct OAuthSession: Codable, Equatable, Sendable {
  let accessToken: String
  let refreshToken: String
  let tokenType: String
  let expiresAt: Date
  let userID: String
  let userEmail: String

  var isExpired: Bool {
    Date() >= expiresAt
  }

  var shouldRefresh: Bool {
    let threshold = expiresAt.addingTimeInterval(-300)
    return Date() >= threshold
  }
}

enum AuthSessionState: Equatable, Sendable {
  case unauthenticated
  case authenticating
  case authenticated(OAuthSession)
  case refreshing
  case failed(message: String)
}

struct OAuthTokenPayload: Equatable, Sendable {
  let accessToken: String
  let refreshToken: String
  let tokenType: String
  let expiresIn: TimeInterval
  let userID: String
  let userEmail: String

  func toSession(now: Date = Date()) -> OAuthSession {
    OAuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenType: tokenType,
      expiresAt: now.addingTimeInterval(expiresIn),
      userID: userID,
      userEmail: userEmail
    )
  }
}

protocol OAuthClient {
  func exchangeAuthorizationCode(_ code: String) async throws -> OAuthTokenPayload
  func refreshToken(_ refreshToken: String) async throws -> OAuthTokenPayload
}

struct OAuthEnvironmentConfiguration: Sendable {
  let baseURL: URL
  let clientID: String
  let redirectURI: String

  static func fromEnvironment(_ environment: [String: String] = ProcessInfo.processInfo.environment) -> OAuthEnvironmentConfiguration? {
    guard
      let baseURLString = environment["SERENITY_OAUTH_BASE_URL"],
      let baseURL = URL(string: baseURLString),
      let clientID = environment["SERENITY_OAUTH_CLIENT_ID"], !clientID.isEmpty,
      let redirectURI = environment["SERENITY_OAUTH_REDIRECT_URI"], !redirectURI.isEmpty
    else {
      return nil
    }

    return OAuthEnvironmentConfiguration(baseURL: baseURL, clientID: clientID, redirectURI: redirectURI)
  }
}

enum OAuthClientError: Error, LocalizedError {
  case notConfigured
  case invalidResponse
  case requestFailed(status: Int, message: String)

  var errorDescription: String? {
    switch self {
    case .notConfigured:
      return "OAuth client is not configured."
    case .invalidResponse:
      return "Invalid OAuth response."
    case .requestFailed(let status, let message):
      return "OAuth request failed with status \(status): \(message)"
    }
  }
}

final class URLSessionOAuthClient: OAuthClient {
  private let configuration: OAuthEnvironmentConfiguration
  private let session: URLSession
  private let decoder = JSONDecoder()

  init(configuration: OAuthEnvironmentConfiguration, session: URLSession = .shared) {
    self.configuration = configuration
    self.session = session
  }

  func exchangeAuthorizationCode(_ code: String) async throws -> OAuthTokenPayload {
    try await requestToken(
      grantType: "authorization_code",
      body: [
        "code": code,
        "client_id": configuration.clientID,
        "redirect_uri": configuration.redirectURI,
      ]
    )
  }

  func refreshToken(_ refreshToken: String) async throws -> OAuthTokenPayload {
    try await requestToken(
      grantType: "refresh_token",
      body: [
        "refresh_token": refreshToken,
        "client_id": configuration.clientID,
      ]
    )
  }

  private func requestToken(grantType: String, body: [String: String]) async throws -> OAuthTokenPayload {
    let endpoint = configuration.baseURL.appendingPathComponent("oauth/token")
    var request = URLRequest(url: endpoint)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")

    var payload = body
    payload["grant_type"] = grantType
    request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])

    let (data, response) = try await session.data(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw OAuthClientError.invalidResponse
    }

    guard (200 ... 299).contains(http.statusCode) else {
      let message = String(data: data, encoding: .utf8) ?? "unknown error"
      throw OAuthClientError.requestFailed(status: http.statusCode, message: message)
    }

    let responseBody = try decoder.decode(TokenResponse.self, from: data)
    return OAuthTokenPayload(
      accessToken: responseBody.accessToken,
      refreshToken: responseBody.refreshToken,
      tokenType: responseBody.tokenType,
      expiresIn: responseBody.expiresIn,
      userID: responseBody.userID,
      userEmail: responseBody.userEmail
    )
  }
}

private struct TokenResponse: Decodable {
  let accessToken: String
  let refreshToken: String
  let tokenType: String
  let expiresIn: TimeInterval
  let userID: String
  let userEmail: String

  enum CodingKeys: String, CodingKey {
    case accessToken = "access_token"
    case refreshToken = "refresh_token"
    case tokenType = "token_type"
    case expiresIn = "expires_in"
    case userID = "user_id"
    case userEmail = "user_email"
  }
}

private struct UnavailableOAuthClient: OAuthClient {
  func exchangeAuthorizationCode(_ code: String) async throws -> OAuthTokenPayload {
    throw OAuthClientError.notConfigured
  }

  func refreshToken(_ refreshToken: String) async throws -> OAuthTokenPayload {
    throw OAuthClientError.notConfigured
  }
}

actor OAuthSessionStore {
  private let defaults: UserDefaults
  private let key: String
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()

  init(defaults: UserDefaults = .standard, key: String = "serenity.macos.oauth.session") {
    self.defaults = defaults
    self.key = key
    encoder.dateEncodingStrategy = .iso8601
    decoder.dateDecodingStrategy = .iso8601
  }

  func load() -> OAuthSession? {
    guard let data = defaults.data(forKey: key) else {
      return nil
    }

    return try? decoder.decode(OAuthSession.self, from: data)
  }

  func save(_ session: OAuthSession) {
    guard let data = try? encoder.encode(session) else { return }
    defaults.set(data, forKey: key)
  }

  func clear() {
    defaults.removeObject(forKey: key)
  }
}

actor AuthSessionManager {
  private let oauthClient: OAuthClient
  private let store: OAuthSessionStore
  private(set) var state: AuthSessionState = .unauthenticated

  init(
    oauthClient: OAuthClient? = OAuthEnvironmentConfiguration.fromEnvironment().map {
      URLSessionOAuthClient(configuration: $0)
    },
    store: OAuthSessionStore = OAuthSessionStore()
  ) {
    self.oauthClient = oauthClient ?? UnavailableOAuthClient()
    self.store = store
  }

  func bootstrap() async -> AuthSessionState {
    guard let session = await store.load() else {
      state = .unauthenticated
      return state
    }

    if session.isExpired {
      return await refreshSession(force: true)
    }

    state = .authenticated(session)
    return state
  }

  func login(withAuthorizationCode code: String) async -> AuthSessionState {
    state = .authenticating

    do {
      let token = try await oauthClient.exchangeAuthorizationCode(code)
      let session = token.toSession()
      await store.save(session)
      state = .authenticated(session)
      return state
    } catch {
      state = .failed(message: error.localizedDescription)
      return state
    }
  }

  func refreshSessionIfNeeded() async -> AuthSessionState {
    guard case .authenticated(let session) = state else {
      return state
    }

    guard session.shouldRefresh else {
      return state
    }

    return await refreshSession(force: false)
  }

  func refreshSession(force: Bool) async -> AuthSessionState {
    let currentSession = await store.load()

    guard let session = currentSession else {
      state = .unauthenticated
      return state
    }

    if !force, !session.shouldRefresh {
      state = .authenticated(session)
      return state
    }

    state = .refreshing

    do {
      let refreshed = try await oauthClient.refreshToken(session.refreshToken).toSession()
      await store.save(refreshed)
      state = .authenticated(refreshed)
      return state
    } catch {
      await store.clear()
      state = .failed(message: error.localizedDescription)
      return state
    }
  }

  func logout() async -> AuthSessionState {
    await store.clear()
    state = .unauthenticated
    return state
  }

  func currentSession() -> OAuthSession? {
    guard case .authenticated(let session) = state else {
      return nil
    }

    return session
  }
}
