import Foundation
import XCTest
@testable import SerenityMac

final class LocalLockManagerTests: XCTestCase {
  func testEnableLockLockAndUnlock() async {
    let suiteName = "serenity.macos.lock.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = LocalLockStore(
      defaults: defaults,
      hashKey: "hash",
      failedAttemptsKey: "failed",
      lockoutUntilKey: "lockout"
    )
    let manager = LocalLockManager(store: store, policy: LocalLockPolicy(maxFailedAttempts: 3, lockoutDuration: 60, inactivityTimeout: 120))

    let enabled = await manager.setEnabled(true, password: "pass-1")
    XCTAssertEqual(enabled, .unlocked)

    let locked = await manager.lock()
    XCTAssertEqual(locked, .locked(attemptsRemaining: 3))

    let unlocked = await manager.unlock(password: "pass-1")
    XCTAssertEqual(unlocked, .unlocked)
  }

  func testLockoutAfterMaxFailedAttempts() async {
    let suiteName = "serenity.macos.lock.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = LocalLockStore(
      defaults: defaults,
      hashKey: "hash",
      failedAttemptsKey: "failed",
      lockoutUntilKey: "lockout"
    )
    let policy = LocalLockPolicy(maxFailedAttempts: 2, lockoutDuration: 120, inactivityTimeout: 120)
    let manager = LocalLockManager(store: store, policy: policy)

    _ = await manager.setEnabled(true, password: "pass-1", now: Date(timeIntervalSince1970: 100))
    _ = await manager.lock()

    let firstFail = await manager.unlock(password: "wrong", now: Date(timeIntervalSince1970: 101))
    XCTAssertEqual(firstFail, .locked(attemptsRemaining: 1))

    let secondFail = await manager.unlock(password: "wrong", now: Date(timeIntervalSince1970: 102))
    guard case .lockedOut(let until) = secondFail else {
      return XCTFail("Expected lockedOut status")
    }
    XCTAssertEqual(until, Date(timeIntervalSince1970: 222))
  }

  func testBiometricUnlockBypassesPasswordEntryWhenNotLockedOut() async {
    let suiteName = "serenity.macos.lock.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let store = LocalLockStore(
      defaults: defaults,
      hashKey: "hash",
      failedAttemptsKey: "failed",
      lockoutUntilKey: "lockout"
    )
    let manager = LocalLockManager(store: store, policy: LocalLockPolicy(maxFailedAttempts: 2, lockoutDuration: 60, inactivityTimeout: 120))

    _ = await manager.setEnabled(true, password: "pass-1")
    _ = await manager.lock()

    let unlocked = await manager.unlockWithBiometric()
    XCTAssertEqual(unlocked, .unlocked)
  }
}
