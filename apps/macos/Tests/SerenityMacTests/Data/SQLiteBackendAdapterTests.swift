import Foundation
import XCTest
@testable import SerenityMac

final class SQLiteBackendAdapterTests: XCTestCase {
  func testBootstrapAndRepositoryFactories() async throws {
    let databaseURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("serenity-macos-sqlite-adapter")
      .appendingPathComponent(UUID().uuidString, isDirectory: true)
      .appendingPathComponent("serenity.sqlite3")

    let adapter = SQLiteBackendAdapter(databaseURL: databaseURL)

    let firstRun = try await adapter.bootstrap()
    XCTAssertFalse(firstRun.appliedMigrations.isEmpty)

    let diagnostics = try adapter.diagnostics()
    XCTAssertEqual(diagnostics.databasePath, databaseURL.path)
    XCTAssertTrue(diagnostics.isBootstrapped)

    let coreRepositories = try adapter.makeCoreRepositories()
    let aiRepositories = try adapter.makeAIRepositories()

    XCTAssertNoThrow(try coreRepositories.tasks.fetchAll())
    XCTAssertNoThrow(try aiRepositories.insights.fetchAll(limit: 10))

    let secondRun = try await adapter.bootstrap()
    XCTAssertTrue(secondRun.appliedMigrations.isEmpty)
  }
}
