import Foundation
import LocalAuthentication

enum BiometricAuthAvailability: Equatable, Sendable {
  case available
  case unavailable(reason: String)
}

protocol BiometricAuthenticating {
  func canEvaluatePolicy(_ policy: LAPolicy, error: NSErrorPointer) -> Bool
  func evaluatePolicy(_ policy: LAPolicy, localizedReason: String) async throws -> Bool
}

extension LAContext: BiometricAuthenticating {}

final class BiometricAuthService {
  typealias ContextFactory = () -> BiometricAuthenticating

  private let contextFactory: ContextFactory

  init(contextFactory: @escaping ContextFactory = { LAContext() }) {
    self.contextFactory = contextFactory
  }

  func availability() -> BiometricAuthAvailability {
    let context = contextFactory()
    var error: NSError?

    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
      return .available
    }

    return .unavailable(reason: error?.localizedDescription ?? "Touch ID is unavailable.")
  }

  func authenticate(reason: String = "Unlock Serenity") async -> Bool {
    let context = contextFactory()
    do {
      return try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
    } catch {
      return false
    }
  }
}
