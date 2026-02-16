import Foundation

struct BackendProfileCapabilities: Equatable, Sendable {
  let supportsLocalPersistence: Bool
  let supportsCloudSync: Bool
  let supportsExternalConnection: Bool
  let requiresAuthentication: Bool
}

struct BackendProfileDescriptor: Identifiable, Equatable, Sendable {
  let profile: BackendProfile
  let title: String
  let capabilities: BackendProfileCapabilities

  var id: String { profile.rawValue }
}

enum BackendProfileValidationState: Equatable, Sendable {
  case unknown
  case available(message: String)
  case unavailable(reason: String)

  var message: String {
    switch self {
    case .unknown:
      return "Validation has not run yet."
    case .available(let message):
      return message
    case .unavailable(let reason):
      return reason
    }
  }

  var isAvailable: Bool {
    if case .available = self {
      return true
    }

    return false
  }
}

struct BackendProfileSelectionState: Equatable, Sendable {
  var activeProfile: BackendProfile
  var descriptors: [BackendProfileDescriptor]
  var validations: [BackendProfile: BackendProfileValidationState]
  var lastValidatedAt: [BackendProfile: Date]
}

struct BackendProfileSwitchResult: Equatable, Sendable {
  let previousProfile: BackendProfile
  let requestedProfile: BackendProfile
  let activeProfile: BackendProfile
  let switched: Bool
  let validationState: BackendProfileValidationState
  let state: BackendProfileSelectionState
}

struct BackendProfileRegistry: Sendable {
  let descriptors: [BackendProfile: BackendProfileDescriptor]
  let validators: [BackendProfile: @Sendable () async -> BackendProfileValidationState]

  func descriptor(for profile: BackendProfile) -> BackendProfileDescriptor {
    descriptors[profile] ?? BackendProfileDescriptor(
      profile: profile,
      title: profile.title,
      capabilities: BackendProfileCapabilities(
        supportsLocalPersistence: false,
        supportsCloudSync: false,
        supportsExternalConnection: false,
        requiresAuthentication: false
      )
    )
  }

  var orderedDescriptors: [BackendProfileDescriptor] {
    BackendProfile.allCases.map(descriptor(for:))
  }

  static let live = BackendProfileRegistry(
    descriptors: [
      .sqliteLocal: BackendProfileDescriptor(
        profile: .sqliteLocal,
        title: "SQLite Local",
        capabilities: BackendProfileCapabilities(
          supportsLocalPersistence: true,
          supportsCloudSync: false,
          supportsExternalConnection: false,
          requiresAuthentication: false
        )
      ),
      .serenityCloud: BackendProfileDescriptor(
        profile: .serenityCloud,
        title: "Serenity Cloud",
        capabilities: BackendProfileCapabilities(
          supportsLocalPersistence: true,
          supportsCloudSync: true,
          supportsExternalConnection: false,
          requiresAuthentication: true
        )
      ),
      .externalPostgres: BackendProfileDescriptor(
        profile: .externalPostgres,
        title: "External PostgreSQL",
        capabilities: BackendProfileCapabilities(
          supportsLocalPersistence: true,
          supportsCloudSync: true,
          supportsExternalConnection: true,
          requiresAuthentication: true
        )
      ),
    ],
    validators: [
      .sqliteLocal: {
        .available(message: "Local SQLite backend is available.")
      },
      .serenityCloud: {
        guard let configuration = SerenityCloudConfiguration.fromEnvironment() else {
          return .unavailable(reason: "Serenity Cloud is not configured.")
        }

        let adapter = SerenityCloudAdapter(configuration: configuration)
        return await adapter.validateConnection()
      },
      .externalPostgres: {
        guard let configuration = ExternalPostgresConfiguration.fromEnvironment() else {
          return .unavailable(reason: "External PostgreSQL is not configured.")
        }

        let adapter = ExternalPostgresAdapter(configuration: configuration)
        return await adapter.validateConnection()
      },
    ]
  )
}

actor BackendProfileManager {
  private let defaults: UserDefaults
  private let defaultsKey: String
  private let registry: BackendProfileRegistry
  private var selectionState: BackendProfileSelectionState

  init(
    defaults: UserDefaults = .standard,
    defaultsKey: String = "serenity.macos.active_backend_profile",
    registry: BackendProfileRegistry = .live
  ) {
    self.defaults = defaults
    self.defaultsKey = defaultsKey
    self.registry = registry

    let persistedProfile = defaults.string(forKey: defaultsKey)
      .flatMap(BackendProfile.init(rawValue:))
      ?? .sqliteLocal

    self.selectionState = BackendProfileSelectionState(
      activeProfile: persistedProfile,
      descriptors: registry.orderedDescriptors,
      validations: [:],
      lastValidatedAt: [:]
    )
  }

  func currentState() -> BackendProfileSelectionState {
    selectionState
  }

  func descriptor(for profile: BackendProfile) -> BackendProfileDescriptor {
    registry.descriptor(for: profile)
  }

  func switchProfile(to profile: BackendProfile) async -> BackendProfileSwitchResult {
    let previous = selectionState.activeProfile
    let validationState = await validateAndStore(profile)

    if validationState.isAvailable {
      selectionState.activeProfile = profile
      defaults.set(profile.rawValue, forKey: defaultsKey)
    }

    return BackendProfileSwitchResult(
      previousProfile: previous,
      requestedProfile: profile,
      activeProfile: selectionState.activeProfile,
      switched: previous != selectionState.activeProfile,
      validationState: validationState,
      state: selectionState
    )
  }

  @discardableResult
  func select(_ profile: BackendProfile) async -> BackendProfileSelectionState {
    let result = await switchProfile(to: profile)
    return result.state
  }

  func refreshValidation() async -> BackendProfileSelectionState {
    _ = await validateAndStore(selectionState.activeProfile)
    return selectionState
  }

  private func validateAndStore(_ profile: BackendProfile) async -> BackendProfileValidationState {
    let status = await registry.validators[profile]?() ?? .unavailable(reason: "No validator configured.")
    selectionState.validations[profile] = status
    selectionState.lastValidatedAt[profile] = Date()
    return status
  }
}
