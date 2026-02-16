import Foundation

enum SensitiveOperation: String, CaseIterable, Sendable {
  case backendSwitch
  case localLockToggle
  case passwordUnlock
  case biometricUnlock
  case signOut
}

struct RateGuardPolicy: Equatable, Sendable {
  let maxAttempts: Int
  let window: TimeInterval

  init(maxAttempts: Int, window: TimeInterval) {
    self.maxAttempts = maxAttempts
    self.window = window
  }
}

struct RateGuardDecision: Equatable, Sendable {
  let allowed: Bool
  let retryAfter: TimeInterval
  let remainingAttempts: Int
}

actor SensitiveOperationRateGuard {
  private let policies: [SensitiveOperation: RateGuardPolicy]
  private var attempts: [SensitiveOperation: [Date]] = [:]

  init(policies: [SensitiveOperation: RateGuardPolicy] = SensitiveOperationRateGuard.defaultPolicies) {
    self.policies = policies
  }

  func evaluate(_ operation: SensitiveOperation, now: Date = Date()) -> RateGuardDecision {
    guard let policy = policies[operation] else {
      return RateGuardDecision(allowed: true, retryAfter: 0, remainingAttempts: Int.max)
    }

    let cutoff = now.addingTimeInterval(-policy.window)
    let recentAttempts = (attempts[operation] ?? []).filter { $0 >= cutoff }
    attempts[operation] = recentAttempts

    if recentAttempts.count >= policy.maxAttempts {
      let oldest = recentAttempts.first ?? now
      let retryAfter = max(0, policy.window - now.timeIntervalSince(oldest))
      return RateGuardDecision(allowed: false, retryAfter: retryAfter, remainingAttempts: 0)
    }

    attempts[operation, default: []].append(now)
    let remaining = max(0, policy.maxAttempts - (recentAttempts.count + 1))
    return RateGuardDecision(allowed: true, retryAfter: 0, remainingAttempts: remaining)
  }

  func reset(_ operation: SensitiveOperation) {
    attempts[operation] = []
  }

  static let defaultPolicies: [SensitiveOperation: RateGuardPolicy] = [
    .backendSwitch: RateGuardPolicy(maxAttempts: 5, window: 120),
    .localLockToggle: RateGuardPolicy(maxAttempts: 6, window: 120),
    .passwordUnlock: RateGuardPolicy(maxAttempts: 10, window: 120),
    .biometricUnlock: RateGuardPolicy(maxAttempts: 10, window: 120),
    .signOut: RateGuardPolicy(maxAttempts: 8, window: 120),
  ]
}
