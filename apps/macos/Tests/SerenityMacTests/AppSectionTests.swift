import XCTest
@testable import SerenityMac

final class AppSectionTests: XCTestCase {
  func testAllSectionsArePresentInNavigationOrder() {
    XCTAssertEqual(
      AppSection.allCases,
      [.home, .actionHub, .today, .journal, .goals, .projects, .integrations, .insights, .database, .settings],
    )
  }
}
