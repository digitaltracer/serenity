import LocalAuthentication
import XCTest
@testable import SerenityMac

final class BiometricAuthServiceTests: XCTestCase {
  func testAvailabilityAvailableWhenContextSupportsBiometrics() {
    let service = BiometricAuthService {
      MockBiometricContext(canEvaluate: true, evaluateResult: true)
    }

    XCTAssertEqual(service.availability(), .available)
  }

  func testAvailabilityUnavailableWhenContextRejectsBiometrics() {
    let service = BiometricAuthService {
      MockBiometricContext(canEvaluate: false, evaluateResult: false, errorMessage: "Biometry not enrolled")
    }

    XCTAssertEqual(service.availability(), .unavailable(reason: "Biometry not enrolled"))
  }

  func testAuthenticateReturnsTrueOnSuccessfulEvaluation() async {
    let service = BiometricAuthService {
      MockBiometricContext(canEvaluate: true, evaluateResult: true)
    }

    let result = await service.authenticate(reason: "Test unlock")
    XCTAssertTrue(result)
  }
}

private final class MockBiometricContext: BiometricAuthenticating {
  private let canEvaluate: Bool
  private let evaluateResult: Bool
  private let errorMessage: String?

  init(canEvaluate: Bool, evaluateResult: Bool, errorMessage: String? = nil) {
    self.canEvaluate = canEvaluate
    self.evaluateResult = evaluateResult
    self.errorMessage = errorMessage
  }

  func canEvaluatePolicy(_ policy: LAPolicy, error: NSErrorPointer) -> Bool {
    if !canEvaluate, let errorMessage {
      error?.pointee = NSError(domain: "SerenityTest", code: 1, userInfo: [NSLocalizedDescriptionKey: errorMessage])
    }
    return canEvaluate
  }

  func evaluatePolicy(_ policy: LAPolicy, localizedReason: String) async throws -> Bool {
    evaluateResult
  }
}
