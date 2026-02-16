import XCTest
@testable import SerenityMac

final class ExternalPostgresAdapterTests: XCTestCase {
  func testConfigurationParsesEnvironment() {
    let config = ExternalPostgresConfiguration.fromEnvironment(
      [
        "POSTGRES_HOST": "db.example.com",
        "POSTGRES_PORT": "5433",
        "POSTGRES_DATABASE": "serenity",
        "POSTGRES_USER": "serenity_user",
        "POSTGRES_PASSWORD": "secret",
        "POSTGRES_SSLMODE": "verify-full",
      ]
    )

    XCTAssertEqual(config?.host, "db.example.com")
    XCTAssertEqual(config?.port, 5433)
    XCTAssertEqual(config?.database, "serenity")
    XCTAssertEqual(config?.username, "serenity_user")
    XCTAssertEqual(config?.sslMode, "verify-full")
  }

  func testValidateConnectionUsesInjectedConnectivityProbe() async {
    let config = ExternalPostgresConfiguration(
      host: "localhost",
      port: 5432,
      database: "serenity",
      username: "user",
      password: "pass"
    )

    let adapter = ExternalPostgresAdapter(
      configuration: config,
      connectivityProbe: { _, _, _ in true }
    )

    let state = await adapter.validateConnection()
    XCTAssertEqual(state, .available(message: "Connected to external PostgreSQL endpoint."))

    let diagnostics = adapter.diagnostics()
    XCTAssertEqual(diagnostics.host, "localhost")
    XCTAssertEqual(diagnostics.port, 5432)
    XCTAssertEqual(diagnostics.database, "serenity")
    XCTAssertEqual(diagnostics.username, "user")
    XCTAssertNotNil(diagnostics.lastHealthyAt)
  }
}
