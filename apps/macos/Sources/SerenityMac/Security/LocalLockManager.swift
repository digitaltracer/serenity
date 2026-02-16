import CryptoKit
import Foundation

struct LocalLockPolicy: Equatable, Sendable {
  let maxFailedAttempts: Int
  let lockoutDuration: TimeInterval
  let inactivityTimeout: TimeInterval

  init(maxFailedAttempts: Int = 5, lockoutDuration: TimeInterval = 300, inactivityTimeout: TimeInterval = 900) {
    self.maxFailedAttempts = maxFailedAttempts
    self.lockoutDuration = lockoutDuration
    self.inactivityTimeout = inactivityTimeout
  }
}

enum LocalLockStatus: Equatable, Sendable {
  case disabled
  case unlocked
  case locked(attemptsRemaining: Int)
  case lockedOut(until: Date)
}

actor LocalLockStore {
  private let defaults: UserDefaults
  private let hashKey: String
  private let failedAttemptsKey: String
  private let lockoutUntilKey: String

  init(
    defaults: UserDefaults = .standard,
    hashKey: String = "serenity.macos.local_lock.hash",
    failedAttemptsKey: String = "serenity.macos.local_lock.failed_attempts",
    lockoutUntilKey: String = "serenity.macos.local_lock.lockout_until"
  ) {
    self.defaults = defaults
    self.hashKey = hashKey
    self.failedAttemptsKey = failedAttemptsKey
    self.lockoutUntilKey = lockoutUntilKey
  }

  func passwordHash() -> String? {
    defaults.string(forKey: hashKey)
  }

  func setPasswordHash(_ hash: String?) {
    defaults.set(hash, forKey: hashKey)
  }

  func failedAttempts() -> Int {
    defaults.integer(forKey: failedAttemptsKey)
  }

  func setFailedAttempts(_ attempts: Int) {
    defaults.set(max(0, attempts), forKey: failedAttemptsKey)
  }

  func lockoutUntil() -> Date? {
    defaults.object(forKey: lockoutUntilKey) as? Date
  }

  func setLockoutUntil(_ date: Date?) {
    defaults.set(date, forKey: lockoutUntilKey)
  }

  func clear() {
    defaults.removeObject(forKey: hashKey)
    defaults.removeObject(forKey: failedAttemptsKey)
    defaults.removeObject(forKey: lockoutUntilKey)
  }
}

actor LocalLockManager {
  private let store: LocalLockStore
  private let policy: LocalLockPolicy
  private var status: LocalLockStatus
  private var lastInteractionAt: Date?

  init(store: LocalLockStore = LocalLockStore(), policy: LocalLockPolicy = LocalLockPolicy()) {
    self.store = store
    self.policy = policy
    self.status = .disabled
  }

  func bootstrap(isEnabled: Bool, now: Date = Date()) async -> LocalLockStatus {
    if !isEnabled {
      status = .disabled
      return status
    }

    if let lockoutUntil = await store.lockoutUntil(), lockoutUntil > now {
      status = .lockedOut(until: lockoutUntil)
      return status
    }

    let configured = await store.passwordHash() != nil
    if configured {
      status = .locked(attemptsRemaining: await attemptsRemaining())
    } else {
      status = .disabled
    }

    return status
  }

  func setEnabled(_ enabled: Bool, password: String?, now: Date = Date()) async -> LocalLockStatus {
    guard enabled else {
      await store.clear()
      lastInteractionAt = now
      status = .disabled
      return status
    }

    guard let password, !password.isEmpty else {
      status = .disabled
      return status
    }

    await store.setPasswordHash(Self.hash(password: password))
    await store.setFailedAttempts(0)
    await store.setLockoutUntil(nil)
    lastInteractionAt = now
    status = .unlocked
    return status
  }

  func lock() async -> LocalLockStatus {
    guard await store.passwordHash() != nil else {
      status = .disabled
      return status
    }

    status = .locked(attemptsRemaining: await attemptsRemaining())
    return status
  }

  func unlock(password: String, now: Date = Date()) async -> LocalLockStatus {
    guard let expectedHash = await store.passwordHash() else {
      status = .disabled
      return status
    }

    if let lockoutUntil = await store.lockoutUntil(), lockoutUntil > now {
      status = .lockedOut(until: lockoutUntil)
      return status
    }

    if Self.hash(password: password) == expectedHash {
      await store.setFailedAttempts(0)
      await store.setLockoutUntil(nil)
      lastInteractionAt = now
      status = .unlocked
      return status
    }

    let failed = await store.failedAttempts() + 1
    await store.setFailedAttempts(failed)

    if failed >= policy.maxFailedAttempts {
      let lockoutUntil = now.addingTimeInterval(policy.lockoutDuration)
      await store.setLockoutUntil(lockoutUntil)
      status = .lockedOut(until: lockoutUntil)
      return status
    }

    status = .locked(attemptsRemaining: await attemptsRemaining())
    return status
  }

  func unlockWithBiometric(now: Date = Date()) async -> LocalLockStatus {
    guard await store.passwordHash() != nil else {
      status = .disabled
      return status
    }

    if let lockoutUntil = await store.lockoutUntil(), lockoutUntil > now {
      status = .lockedOut(until: lockoutUntil)
      return status
    }

    await store.setFailedAttempts(0)
    await store.setLockoutUntil(nil)
    lastInteractionAt = now
    status = .unlocked
    return status
  }

  func recordInteraction(at date: Date = Date()) {
    lastInteractionAt = date
  }

  func enforceInactivityLock(now: Date = Date()) async -> LocalLockStatus {
    guard case .unlocked = status else { return status }
    guard let lastInteractionAt else { return status }

    if now.timeIntervalSince(lastInteractionAt) >= policy.inactivityTimeout {
      status = .locked(attemptsRemaining: await attemptsRemaining())
    }

    return status
  }

  func currentStatus(now: Date = Date()) async -> LocalLockStatus {
    if case .lockedOut = status {
      if let lockoutUntil = await store.lockoutUntil(), lockoutUntil > now {
        return .lockedOut(until: lockoutUntil)
      }

      await store.setLockoutUntil(nil)
      await store.setFailedAttempts(0)
      status = .locked(attemptsRemaining: await attemptsRemaining())
    }

    return status
  }

  private func attemptsRemaining() async -> Int {
    let failedAttempts = await store.failedAttempts()
    return max(0, policy.maxFailedAttempts - failedAttempts)
  }

  private static func hash(password: String) -> String {
    let digest = SHA256.hash(data: Data(password.utf8))
    return digest.map { String(format: "%02x", $0) }.joined()
  }
}
