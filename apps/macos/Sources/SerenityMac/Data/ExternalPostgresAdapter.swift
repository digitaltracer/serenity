import Foundation
import Network

struct ExternalPostgresConfiguration: Equatable, Sendable {
  let host: String
  let port: UInt16
  let database: String
  let username: String
  let password: String
  let sslMode: String
  let timeout: TimeInterval

  init(
    host: String,
    port: UInt16,
    database: String,
    username: String,
    password: String,
    sslMode: String = "require",
    timeout: TimeInterval = 10
  ) {
    self.host = host
    self.port = port
    self.database = database
    self.username = username
    self.password = password
    self.sslMode = sslMode
    self.timeout = timeout
  }

  static func fromEnvironment(_ environment: [String: String] = ProcessInfo.processInfo.environment) -> ExternalPostgresConfiguration? {
    guard
      let host = environment["POSTGRES_HOST"], !host.isEmpty,
      let database = environment["POSTGRES_DATABASE"], !database.isEmpty,
      let username = environment["POSTGRES_USER"], !username.isEmpty,
      let password = environment["POSTGRES_PASSWORD"], !password.isEmpty
    else {
      return nil
    }

    let port = UInt16(environment["POSTGRES_PORT"] ?? "5432") ?? 5432
    let sslMode = environment["POSTGRES_SSLMODE"] ?? "require"

    return ExternalPostgresConfiguration(
      host: host,
      port: port,
      database: database,
      username: username,
      password: password,
      sslMode: sslMode
    )
  }
}

struct ExternalPostgresDiagnostics: Equatable, Sendable {
  let host: String
  let port: UInt16
  let database: String
  let username: String
  let sslMode: String
  let lastHealthyAt: Date?
}

final class ExternalPostgresAdapter {
  typealias ConnectivityProbe = @Sendable (_ host: String, _ port: UInt16, _ timeout: TimeInterval) async -> Bool

  let profile: BackendProfile = .externalPostgres

  private let configuration: ExternalPostgresConfiguration
  private let connectivityProbe: ConnectivityProbe
  private var lastHealthyAt: Date?

  init(
    configuration: ExternalPostgresConfiguration,
    connectivityProbe: ConnectivityProbe? = nil
  ) {
    self.configuration = configuration
    self.connectivityProbe = connectivityProbe ?? Self.defaultConnectivityProbe
  }

  func validateConnection() async -> BackendProfileValidationState {
    let reachable = await connectivityProbe(configuration.host, configuration.port, configuration.timeout)

    if reachable {
      lastHealthyAt = Date()
      return .available(message: "Connected to external PostgreSQL endpoint.")
    }

    return .unavailable(reason: "PostgreSQL endpoint is unreachable at \(configuration.host):\(configuration.port).")
  }

  func diagnostics() -> ExternalPostgresDiagnostics {
    ExternalPostgresDiagnostics(
      host: configuration.host,
      port: configuration.port,
      database: configuration.database,
      username: configuration.username,
      sslMode: configuration.sslMode,
      lastHealthyAt: lastHealthyAt
    )
  }

  private static let defaultConnectivityProbe: ConnectivityProbe = { host, port, timeout in
    guard let endpointPort = NWEndpoint.Port(rawValue: port) else {
      return false
    }

    return await withCheckedContinuation { continuation in
      let queue = DispatchQueue(label: "serenity.postgres.connectivity")
      let connection = NWConnection(host: NWEndpoint.Host(host), port: endpointPort, using: .tcp)
      let probeState = ConnectivityProbeState()

      let finish: @Sendable (Bool) -> Void = { isReachable in
        queue.async {
          guard !probeState.didResume else { return }
          probeState.didResume = true
          connection.cancel()
          continuation.resume(returning: isReachable)
        }
      }

      connection.stateUpdateHandler = { connectionState in
        switch connectionState {
        case .ready:
          finish(true)
        case .failed, .cancelled:
          finish(false)
        default:
          break
        }
      }

      connection.start(queue: queue)
      queue.asyncAfter(deadline: .now() + timeout) {
        finish(false)
      }
    }
  }
}

private final class ConnectivityProbeState: @unchecked Sendable {
  var didResume = false
}
