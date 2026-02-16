import Foundation
import XCTest
@testable import SerenityMac

final class BackendProfileManagerTests: XCTestCase {
  func testManagerDefaultsToSQLiteLocal() async {
    let suiteName = "serenity.macos.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let manager = BackendProfileManager(
      defaults: defaults,
      defaultsKey: "active_backend_profile_test_key",
      registry: .live
    )

    let state = await manager.currentState()
    XCTAssertEqual(state.activeProfile, .sqliteLocal)
    XCTAssertEqual(state.descriptors.count, 3)
  }

  func testSwitchDoesNotActivateUnavailableCloudProfile() async {
    let suiteName = "serenity.macos.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let key = "active_backend_profile_test_key"
    let registry = BackendProfileRegistry(
      descriptors: BackendProfileRegistry.live.descriptors,
      validators: [
        .sqliteLocal: { .available(message: "ok") },
        .serenityCloud: { .unavailable(reason: "cloud unavailable in test") },
        .externalPostgres: { .unavailable(reason: "postgres unavailable in test") },
      ]
    )

    let manager = BackendProfileManager(
      defaults: defaults,
      defaultsKey: key,
      registry: registry
    )

    let result = await manager.switchProfile(to: .serenityCloud)
    let updated = result.state

    XCTAssertFalse(result.switched)
    XCTAssertEqual(updated.activeProfile, .sqliteLocal)
    XCTAssertNil(defaults.string(forKey: key))
    XCTAssertEqual(
      updated.validations[.serenityCloud],
      .unavailable(reason: "cloud unavailable in test")
    )
  }

  func testSwitchActivatesAvailableCloudProfile() async {
    let suiteName = "serenity.macos.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let key = "active_backend_profile_test_key"
    let registry = BackendProfileRegistry(
      descriptors: BackendProfileRegistry.live.descriptors,
      validators: [
        .sqliteLocal: { .available(message: "ok") },
        .serenityCloud: { .available(message: "connected") },
        .externalPostgres: { .unavailable(reason: "postgres unavailable in test") },
      ]
    )

    let manager = BackendProfileManager(
      defaults: defaults,
      defaultsKey: key,
      registry: registry
    )

    let result = await manager.switchProfile(to: .serenityCloud)

    XCTAssertTrue(result.switched)
    XCTAssertEqual(result.activeProfile, .serenityCloud)
    XCTAssertEqual(defaults.string(forKey: key), BackendProfile.serenityCloud.rawValue)
  }

  func testProfileSwitchingUnderLoadDoesNotActivateUnavailableProfile() async {
    let suiteName = "serenity.macos.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let key = "active_backend_profile_test_key"
    let registry = BackendProfileRegistry(
      descriptors: BackendProfileRegistry.live.descriptors,
      validators: [
        .sqliteLocal: { .available(message: "ok") },
        .serenityCloud: {
          try? await Task.sleep(nanoseconds: 5_000_000)
          return .available(message: "connected")
        },
        .externalPostgres: {
          try? await Task.sleep(nanoseconds: 5_000_000)
          return .unavailable(reason: "postgres unavailable in test")
        },
      ]
    )

    let manager = BackendProfileManager(
      defaults: defaults,
      defaultsKey: key,
      registry: registry
    )

    await withTaskGroup(of: Void.self) { group in
      for index in 0..<40 {
        group.addTask {
          let target: BackendProfile = index.isMultiple(of: 2) ? .serenityCloud : .externalPostgres
          _ = await manager.switchProfile(to: target)
        }
      }
    }

    let finalState = await manager.currentState()
    XCTAssertNotEqual(finalState.activeProfile, .externalPostgres)
    XCTAssertEqual(
      finalState.validations[.externalPostgres],
      .unavailable(reason: "postgres unavailable in test")
    )
  }

  func testSwitchFailureRetainsPreviousProfileAfterSuccessfulSwitch() async {
    let suiteName = "serenity.macos.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let key = "active_backend_profile_test_key"
    let registry = BackendProfileRegistry(
      descriptors: BackendProfileRegistry.live.descriptors,
      validators: [
        .sqliteLocal: { .available(message: "ok") },
        .serenityCloud: { .available(message: "connected") },
        .externalPostgres: { .unavailable(reason: "failed connection") },
      ]
    )

    let manager = BackendProfileManager(
      defaults: defaults,
      defaultsKey: key,
      registry: registry
    )

    let first = await manager.switchProfile(to: .serenityCloud)
    XCTAssertTrue(first.switched)
    XCTAssertEqual(first.activeProfile, .serenityCloud)

    let second = await manager.switchProfile(to: .externalPostgres)
    XCTAssertFalse(second.switched)
    XCTAssertEqual(second.activeProfile, .serenityCloud)
    XCTAssertEqual(defaults.string(forKey: key), BackendProfile.serenityCloud.rawValue)
  }
}
