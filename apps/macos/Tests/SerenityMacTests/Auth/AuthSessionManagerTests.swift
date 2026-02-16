import Foundation
import XCTest
@testable import SerenityMac

final class AuthSessionManagerTests: XCTestCase {
  func testLoginPersistsSessionAndAuthenticates() async {
    let suiteName = "serenity.macos.auth.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = OAuthSessionStore(defaults: defaults, key: "oauth_session_test")
    let client = MockOAuthClient(
      exchangeResponse: OAuthTokenPayload(
        accessToken: "access-1",
        refreshToken: "refresh-1",
        tokenType: "Bearer",
        expiresIn: 3_600,
        userID: "user-1",
        userEmail: "user@serenity.test"
      ),
      refreshResponse: nil
    )

    let manager = AuthSessionManager(oauthClient: client, store: store)
    let state = await manager.login(withAuthorizationCode: "auth-code")

    guard case .authenticated(let session) = state else {
      return XCTFail("Expected authenticated state")
    }

    XCTAssertEqual(session.accessToken, "access-1")
    XCTAssertEqual(session.userID, "user-1")

    let persisted = await store.load()
    XCTAssertEqual(persisted?.accessToken, "access-1")
  }

  func testBootstrapRestoresPersistedSession() async {
    let suiteName = "serenity.macos.auth.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = OAuthSessionStore(defaults: defaults, key: "oauth_session_test")
    await store.save(
      OAuthSession(
        accessToken: "access-existing",
        refreshToken: "refresh-existing",
        tokenType: "Bearer",
        expiresAt: Date().addingTimeInterval(3_600),
        userID: "user-existing",
        userEmail: "existing@serenity.test"
      )
    )

    let manager = AuthSessionManager(
      oauthClient: MockOAuthClient(exchangeResponse: nil, refreshResponse: nil),
      store: store
    )

    let state = await manager.bootstrap()

    guard case .authenticated(let session) = state else {
      return XCTFail("Expected restored session")
    }

    XCTAssertEqual(session.userID, "user-existing")
  }

  func testRefreshSessionIfNeededUsesRefreshToken() async {
    let suiteName = "serenity.macos.auth.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = OAuthSessionStore(defaults: defaults, key: "oauth_session_test")
    let nearlyExpired = OAuthSession(
      accessToken: "access-old",
      refreshToken: "refresh-old",
      tokenType: "Bearer",
      expiresAt: Date().addingTimeInterval(5),
      userID: "user-old",
      userEmail: "old@serenity.test"
    )
    await store.save(nearlyExpired)

    let client = MockOAuthClient(
      exchangeResponse: nil,
      refreshResponse: OAuthTokenPayload(
        accessToken: "access-new",
        refreshToken: "refresh-new",
        tokenType: "Bearer",
        expiresIn: 3_600,
        userID: "user-old",
        userEmail: "old@serenity.test"
      )
    )

    let manager = AuthSessionManager(oauthClient: client, store: store)
    _ = await manager.bootstrap()

    let refreshedState = await manager.refreshSessionIfNeeded()
    guard case .authenticated(let refreshedSession) = refreshedState else {
      return XCTFail("Expected refreshed authenticated state")
    }

    XCTAssertEqual(refreshedSession.accessToken, "access-new")
    let refreshCalls = await client.refreshCalls
    XCTAssertEqual(refreshCalls, 1)
  }

  func testLogoutClearsPersistedSession() async {
    let suiteName = "serenity.macos.auth.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = OAuthSessionStore(defaults: defaults, key: "oauth_session_test")
    await store.save(
      OAuthSession(
        accessToken: "access-existing",
        refreshToken: "refresh-existing",
        tokenType: "Bearer",
        expiresAt: Date().addingTimeInterval(3_600),
        userID: "user-existing",
        userEmail: "existing@serenity.test"
      )
    )

    let manager = AuthSessionManager(
      oauthClient: MockOAuthClient(exchangeResponse: nil, refreshResponse: nil),
      store: store
    )

    let state = await manager.logout()
    XCTAssertEqual(state, .unauthenticated)
    let persisted = await store.load()
    XCTAssertNil(persisted)
  }
}

private actor MockOAuthClient: OAuthClient {
  let exchangeResponse: OAuthTokenPayload?
  let refreshResponse: OAuthTokenPayload?
  private(set) var refreshCalls: Int = 0

  init(exchangeResponse: OAuthTokenPayload?, refreshResponse: OAuthTokenPayload?) {
    self.exchangeResponse = exchangeResponse
    self.refreshResponse = refreshResponse
  }

  func exchangeAuthorizationCode(_ code: String) async throws -> OAuthTokenPayload {
    try await Task.sleep(for: .milliseconds(10))
    if let exchangeResponse {
      return exchangeResponse
    }
    throw OAuthClientError.notConfigured
  }

  func refreshToken(_ refreshToken: String) async throws -> OAuthTokenPayload {
    refreshCalls += 1
    if let refreshResponse {
      return refreshResponse
    }
    throw OAuthClientError.notConfigured
  }
}
