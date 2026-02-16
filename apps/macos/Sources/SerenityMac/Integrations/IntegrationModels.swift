import Foundation

enum IntegrationProvider: String, CaseIterable, Identifiable, Sendable {
  case google
  case github

  var id: String { rawValue }

  var title: String {
    switch self {
    case .google:
      return "Google Calendar"
    case .github:
      return "GitHub"
    }
  }
}

struct GoogleOAuthConfiguration: Equatable, Sendable {
  var clientID: String
  var clientSecret: String
  var redirectURI: String
  var scopes: [String]
  var authBaseURL: URL
  var tokenURL: URL
  var userInfoURL: URL
  var calendarEventsURL: URL

  static func fromEnvironment() -> GoogleOAuthConfiguration? {
    let env = ProcessInfo.processInfo.environment
    guard let clientID = env["SERENITY_GOOGLE_CLIENT_ID"], !clientID.isEmpty,
          let clientSecret = env["SERENITY_GOOGLE_CLIENT_SECRET"], !clientSecret.isEmpty
    else {
      return nil
    }

    let redirectURI = env["SERENITY_GOOGLE_REDIRECT_URI"] ?? "http://localhost:8080/oauth/callback"
    let scopes = (env["SERENITY_GOOGLE_SCOPES"] ?? "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email")
      .split(separator: " ")
      .map(String.init)
      .filter { !$0.isEmpty }

    return GoogleOAuthConfiguration(
      clientID: clientID,
      clientSecret: clientSecret,
      redirectURI: redirectURI,
      scopes: scopes.isEmpty ? ["https://www.googleapis.com/auth/calendar.readonly"] : scopes,
      authBaseURL: URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!,
      tokenURL: URL(string: "https://oauth2.googleapis.com/token")!,
      userInfoURL: URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!,
      calendarEventsURL: URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
    )
  }
}

struct GoogleIntegrationSession: Codable, Equatable, Sendable {
  var accessToken: String
  var refreshToken: String?
  var expiresAt: Date?
  var userEmail: String?
  var connectedAt: Date
}

struct GoogleIntegrationState: Equatable, Sendable {
  var connected: Bool
  var userEmail: String?
  var expiresAt: Date?
  var syncEnabled: Bool
  var lastSyncAt: Date?
  var lastError: String?

  static let disconnected = GoogleIntegrationState(
    connected: false,
    userEmail: nil,
    expiresAt: nil,
    syncEnabled: false,
    lastSyncAt: nil,
    lastError: nil
  )
}

struct GitHubTokenRecord: Codable, Equatable, Sendable, Identifiable {
  var id: String
  var token: String
  var displayName: String
  var username: String
  var isActive: Bool
  var createdAt: Date
  var updatedAt: Date
  var lastValidatedAt: Date?
  var lastSyncAt: Date?

  var maskedToken: String {
    let suffix = token.suffix(4)
    return "••••\(suffix)"
  }
}

struct GitHubIntegrationState: Equatable, Sendable {
  var tokens: [GitHubTokenRecord]
  var syncEnabled: Bool
  var lastSyncAt: Date?
  var lastError: String?

  static let empty = GitHubIntegrationState(
    tokens: [],
    syncEnabled: false,
    lastSyncAt: nil,
    lastError: nil
  )
}

struct IntegrationSyncOutcome: Equatable, Sendable {
  var provider: IntegrationProvider
  var importedTasks: Int
  var detail: String
}

struct IntegrationDiagnosticsSnapshot: Equatable, Sendable {
  var lines: [String]
}

struct GoogleCalendarSyncPayload: Sendable {
  var tasks: [TaskEntity]
  var project: ProjectEntity?
  var importedCount: Int
}

struct GitHubSyncPayload: Sendable {
  var tasks: [TaskEntity]
  var project: ProjectEntity?
  var importedCount: Int
}

