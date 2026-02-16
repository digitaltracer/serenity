import SwiftUI
import XCTest
@testable import SerenityMac

@MainActor
final class SectionViewSmokeTests: XCTestCase {
  func testIntegrationsSectionViewCanBeConstructed() {
    let state = AppState(
      serenityCloudAdapter: nil,
      externalPostgresAdapter: nil
    )

    let view = IntegrationsSectionView().environmentObject(state)
    XCTAssertNotNil(view)
  }

  func testInsightsSectionViewCanBeConstructed() {
    let state = AppState(
      serenityCloudAdapter: nil,
      externalPostgresAdapter: nil
    )

    let view = InsightsSectionView().environmentObject(state)
    XCTAssertNotNil(view)
  }
}

