import XCTest
@testable import SerenityMac

final class KeychainSecretStoreTests: XCTestCase {
  func testSetGetAndDeleteSecret() throws {
    let backend = InMemorySecretStorageBackend()
    let store = KeychainSecretStore(service: "test.service", backend: backend)

    try store.setSecret("token-123", for: "oauth.access_token")
    XCTAssertTrue(try store.hasSecret(for: "oauth.access_token"))
    XCTAssertEqual(try store.secret(for: "oauth.access_token"), "token-123")

    try store.deleteSecret(for: "oauth.access_token")
    XCTAssertFalse(try store.hasSecret(for: "oauth.access_token"))
    XCTAssertNil(try store.secret(for: "oauth.access_token"))
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
