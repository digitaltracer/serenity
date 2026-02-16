import Foundation
import XCTest
@testable import SerenityMac

final class RateGuardTests: XCTestCase {
  func testRateGuardBlocksAfterThresholdWithinWindow() async {
    let guardrail = SensitiveOperationRateGuard(
      policies: [.backendSwitch: RateGuardPolicy(maxAttempts: 2, window: 60)]
    )

    let base = Date(timeIntervalSince1970: 100)
    let first = await guardrail.evaluate(.backendSwitch, now: base)
    let second = await guardrail.evaluate(.backendSwitch, now: base.addingTimeInterval(1))
    let third = await guardrail.evaluate(.backendSwitch, now: base.addingTimeInterval(2))

    XCTAssertTrue(first.allowed)
    XCTAssertTrue(second.allowed)
    XCTAssertFalse(third.allowed)
    XCTAssertGreaterThan(third.retryAfter, 0)
  }

  func testRateGuardAllowsAfterWindowExpires() async {
    let guardrail = SensitiveOperationRateGuard(
      policies: [.passwordUnlock: RateGuardPolicy(maxAttempts: 1, window: 10)]
    )

    let base = Date(timeIntervalSince1970: 100)
    _ = await guardrail.evaluate(.passwordUnlock, now: base)
    let blocked = await guardrail.evaluate(.passwordUnlock, now: base.addingTimeInterval(5))
    let allowedAgain = await guardrail.evaluate(.passwordUnlock, now: base.addingTimeInterval(11))

    XCTAssertFalse(blocked.allowed)
    XCTAssertTrue(allowedAgain.allowed)
  }
}
