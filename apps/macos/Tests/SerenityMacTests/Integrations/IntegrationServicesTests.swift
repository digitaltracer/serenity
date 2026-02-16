import XCTest
@testable import SerenityMac

final class IntegrationServicesTests: XCTestCase {
  func testGoogleAuthorizationURLIncludesExpectedParameters() async throws {
    let backend = InMemorySecretStorageBackend()
    let store = KeychainSecretStore(service: "test.integrations", backend: backend)
    let configuration = GoogleOAuthConfiguration(
      clientID: "client-id",
      clientSecret: "client-secret",
      redirectURI: "http://localhost:8080/oauth/callback",
      scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      authBaseURL: URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!,
      tokenURL: URL(string: "https://oauth2.googleapis.com/token")!,
      userInfoURL: URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!,
      calendarEventsURL: URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
    )

    let service = GoogleIntegrationService(
      configuration: configuration,
      secretStore: store,
      requestHandler: { _ in throw IntegrationServiceError.invalidResponse }
    )

    let url = try await service.authorizationURL(state: "xyz")
    let components = try XCTUnwrap(URLComponents(url: url, resolvingAgainstBaseURL: false))
    let queryItems = Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).map { ($0.name, $0.value ?? "") })

    XCTAssertEqual(components.host, "accounts.google.com")
    XCTAssertEqual(queryItems["client_id"], "client-id")
    XCTAssertEqual(queryItems["redirect_uri"], "http://localhost:8080/oauth/callback")
    XCTAssertEqual(queryItems["response_type"], "code")
    XCTAssertEqual(queryItems["state"], "xyz")
    XCTAssertTrue((queryItems["scope"] ?? "").contains("calendar.readonly"))
  }

  func testGitHubTokenAddAndListRoundTrip() async throws {
    let backend = InMemorySecretStorageBackend()
    let store = KeychainSecretStore(service: "test.integrations", backend: backend)

    let service = GitHubIntegrationService(
      secretStore: store,
      requestHandler: { request in
        if request.url?.path == "/user" {
          let data = #"{"login":"octocat"}"#.data(using: .utf8)!
          return (data, HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!)
        }

        throw IntegrationServiceError.invalidResponse
      }
    )

    let created = try await service.addToken("ghp_token_value", displayName: "Primary")
    XCTAssertEqual(created.count, 1)
    XCTAssertEqual(created.first?.username, "octocat")
    XCTAssertEqual(created.first?.displayName, "Primary")
    XCTAssertTrue(created.first?.isActive == true)

    let listed = try await service.listTokens()
    XCTAssertEqual(listed.count, 1)
    XCTAssertEqual(listed.first?.maskedToken, "••••alue")
  }

  func testGoogleCalendarSyncCreatesTasksForNewEventsOnly() async throws {
    let backend = InMemorySecretStorageBackend()
    let store = KeychainSecretStore(service: "test.integrations", backend: backend)

    let configuration = GoogleOAuthConfiguration(
      clientID: "client-id",
      clientSecret: "client-secret",
      redirectURI: "http://localhost:8080/oauth/callback",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      authBaseURL: URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!,
      tokenURL: URL(string: "https://oauth2.googleapis.com/token")!,
      userInfoURL: URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!,
      calendarEventsURL: URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
    )

    let service = GoogleIntegrationService(
      configuration: configuration,
      secretStore: store,
      requestHandler: { request in
        let payload = #"""
        {
          "items": [
            {
              "id": "evt_1",
              "status": "confirmed",
              "summary": "Calendar Event One",
              "description": "Planning call",
              "start": { "dateTime": "2026-02-15T10:00:00Z" }
            },
            {
              "id": "evt_2",
              "status": "confirmed",
              "summary": "Calendar Event Two",
              "description": "Standup",
              "start": { "date": "2026-02-16" }
            }
          ]
        }
        """#.data(using: .utf8)!
        return (payload, HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!)
      }
    )

    _ = try await service.connectWithToken(
      accessToken: "access-token",
      refreshToken: nil,
      expiresAt: nil,
      userEmail: "user@example.com"
    )

    let existingTask = TaskEntity(
      id: "existing-1",
      title: "Existing",
      description: nil,
      completed: false,
      completedAt: nil,
      priority: .medium,
      dueDate: nil,
      projectId: nil,
      tags: ["google-event-evt_1"],
      createdAt: Date(),
      updatedAt: Date(),
      subtasks: [],
      recurring: nil,
      userId: nil
    )

    let payload = try await service.syncCalendarTasks(
      existingTasks: [existingTask],
      existingProjects: []
    )

    XCTAssertEqual(payload.importedCount, 1)
    XCTAssertEqual(payload.tasks.count, 1)
    XCTAssertEqual(payload.tasks.first?.title, "Calendar Event Two")
    XCTAssertEqual(payload.project?.name, "Google Calendar")
  }
}

private final class InMemorySecretStorageBackend: SecretStorageBackend {
  private var values: [String: Data] = [:]

  private func namespacedKey(service: String, key: String) -> String {
    "\(service):\(key)"
  }

  func set(service: String, key: String, data: Data) throws {
    values[namespacedKey(service: service, key: key)] = data
  }

  func get(service: String, key: String) throws -> Data? {
    values[namespacedKey(service: service, key: key)]
  }

  func delete(service: String, key: String) throws {
    values.removeValue(forKey: namespacedKey(service: service, key: key))
  }

  func contains(service: String, key: String) throws -> Bool {
    values[namespacedKey(service: service, key: key)] != nil
  }
}

