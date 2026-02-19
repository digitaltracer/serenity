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

  @MainActor
  func testOpeningGlobalSearchClosesHelpCenterAndPrefillsQuery() {
    let state = AppState()
    state.openHelpCenter()

    state.openGlobalSearch(prefill: "parity")

    XCTAssertTrue(state.isGlobalSearchPresented)
    XCTAssertFalse(state.isHelpCenterPresented)
    XCTAssertEqual(state.globalSearchQuery, "parity")
  }

  @MainActor
  func testOpeningHelpCenterClosesGlobalSearch() {
    let state = AppState()
    state.openGlobalSearch(prefill: "task")

    state.openHelpCenter()

    XCTAssertTrue(state.isHelpCenterPresented)
    XCTAssertFalse(state.isGlobalSearchPresented)
  }

  @MainActor
  func testSelectingGlobalSearchResultNavigatesAndClosesSearch() {
    let state = AppState()
    state.openGlobalSearch(prefill: "goal")

    let result = GlobalSearchResult(
      type: .goal,
      entityID: "goal-1",
      title: "Ship mac parity",
      subtitle: "Milestone goal",
      updatedAt: Date()
    )

    state.selectGlobalSearchResult(result)

    XCTAssertEqual(state.selectedSection, .goals)
    XCTAssertFalse(state.isGlobalSearchPresented)
  }
}
