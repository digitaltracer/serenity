import XCTest
@testable import SerenityMac

final class AppStateTests: XCTestCase {
  func testBackendProfilesExposeExpectedOrder() {
    XCTAssertEqual(
      BackendProfile.allCases,
      [.sqliteLocal, .serenityCloud, .externalPostgres],
    )
  }

  func testDefaultSettingsUseLocalSQLiteWithoutLocalLock() {
    let settings = AppSettings()

    XCTAssertEqual(settings.backendProfile, .sqliteLocal)
    XCTAssertFalse(settings.localLockEnabled)
  }
}
