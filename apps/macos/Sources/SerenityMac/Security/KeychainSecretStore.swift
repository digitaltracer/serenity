import Foundation
import Security

enum KeychainSecretStoreError: Error, LocalizedError {
  case unexpectedStatus(OSStatus)
  case encodingFailure

  var errorDescription: String? {
    switch self {
    case .unexpectedStatus(let status):
      return "Keychain operation failed with status \(status)."
    case .encodingFailure:
      return "Failed to encode secret value."
    }
  }
}

protocol SecretStorageBackend {
  func set(service: String, key: String, data: Data) throws
  func get(service: String, key: String) throws -> Data?
  func delete(service: String, key: String) throws
  func contains(service: String, key: String) throws -> Bool
}

struct KeychainBackend: SecretStorageBackend {
  func set(service: String, key: String, data: Data) throws {
    let baseQuery: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]

    let status = SecItemCopyMatching(baseQuery as CFDictionary, nil)
    if status == errSecSuccess {
      let updateStatus = SecItemUpdate(
        baseQuery as CFDictionary,
        [kSecValueData as String: data] as CFDictionary
      )
      guard updateStatus == errSecSuccess else {
        throw KeychainSecretStoreError.unexpectedStatus(updateStatus)
      }
      return
    }

    if status == errSecItemNotFound {
      var addQuery = baseQuery
      addQuery[kSecValueData as String] = data
      addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock

      let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
      guard addStatus == errSecSuccess else {
        throw KeychainSecretStoreError.unexpectedStatus(addStatus)
      }
      return
    }

    throw KeychainSecretStoreError.unexpectedStatus(status)
  }

  func get(service: String, key: String) throws -> Data? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    var result: AnyObject?
    let status = SecItemCopyMatching(query as CFDictionary, &result)

    if status == errSecItemNotFound {
      return nil
    }

    guard status == errSecSuccess else {
      throw KeychainSecretStoreError.unexpectedStatus(status)
    }

    return result as? Data
  }

  func delete(service: String, key: String) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]

    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainSecretStoreError.unexpectedStatus(status)
    }
  }

  func contains(service: String, key: String) throws -> Bool {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: false,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    let status = SecItemCopyMatching(query as CFDictionary, nil)
    if status == errSecSuccess {
      return true
    }
    if status == errSecItemNotFound {
      return false
    }
    throw KeychainSecretStoreError.unexpectedStatus(status)
  }
}

final class KeychainSecretStore {
  private let service: String
  private let backend: SecretStorageBackend

  init(service: String = "com.serenity.macos", backend: SecretStorageBackend = KeychainBackend()) {
    self.service = service
    self.backend = backend
  }

  func setSecret(_ value: String, for key: String) throws {
    guard let data = value.data(using: .utf8) else {
      throw KeychainSecretStoreError.encodingFailure
    }

    try backend.set(service: service, key: key, data: data)
  }

  func secret(for key: String) throws -> String? {
    guard let data = try backend.get(service: service, key: key) else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  func deleteSecret(for key: String) throws {
    try backend.delete(service: service, key: key)
  }

  func hasSecret(for key: String) throws -> Bool {
    try backend.contains(service: service, key: key)
  }
}
