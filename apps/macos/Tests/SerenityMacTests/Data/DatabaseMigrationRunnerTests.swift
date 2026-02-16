import Foundation
import GRDB
import XCTest
@testable import SerenityMac

final class DatabaseMigrationRunnerTests: XCTestCase {
  func testBootstrapAppliesInitialMigrationsOnFreshDatabase() async throws {
    let databaseURL = try makeTemporaryDatabaseURL()
    let runner = DatabaseMigrationRunner()

    let summary = try await runner.bootstrapDatabase(at: databaseURL)

    XCTAssertEqual(summary.appliedMigrations.count, 5)
    XCTAssertTrue(summary.skippedMigrations.isEmpty)

    let dbQueue = try DatabaseQueue(path: databaseURL.path)
    let tables = try await dbQueue.read { db in
      Set(try String.fetchAll(db, sql: "SELECT name FROM sqlite_master WHERE type='table';"))
    }
    let indexes = try await dbQueue.read { db in
      Set(try String.fetchAll(db, sql: "SELECT name FROM sqlite_master WHERE type='index';"))
    }

    XCTAssertTrue(tables.contains("grdb_migrations"))
    XCTAssertTrue(tables.contains("tasks"))
    XCTAssertTrue(tables.contains("projects"))
    XCTAssertTrue(tables.contains("journal_entries"))
    XCTAssertTrue(tables.contains("goals"))
    XCTAssertTrue(tables.contains("app_metadata"))
    XCTAssertTrue(tables.contains("secure_settings"))
    XCTAssertTrue(tables.contains("ai_insights"))
    XCTAssertTrue(tables.contains("ai_recaps"))
    XCTAssertTrue(tables.contains("ai_usage"))
    XCTAssertTrue(tables.contains("summaries"))
    XCTAssertTrue(tables.contains("ai_provider_credentials"))
    XCTAssertTrue(tables.contains("security_audit_events"))
    XCTAssertTrue(indexes.contains("idx_tasks_project_id"))
    XCTAssertTrue(indexes.contains("idx_journal_date"))
    XCTAssertTrue(indexes.contains("idx_goals_status"))
    XCTAssertTrue(indexes.contains("idx_ai_insights_created_at"))
    XCTAssertTrue(indexes.contains("idx_ai_recaps_created_at"))
    XCTAssertTrue(indexes.contains("idx_ai_usage_timestamp"))
    XCTAssertTrue(indexes.contains("idx_summaries_type"))
    XCTAssertTrue(indexes.contains("idx_ai_credentials_provider"))
    XCTAssertTrue(indexes.contains("idx_security_audit_created_at"))
  }

  func testBootstrapIsIdempotentForExistingDatabase() async throws {
    let databaseURL = try makeTemporaryDatabaseURL()
    let runner = DatabaseMigrationRunner()

    _ = try await runner.bootstrapDatabase(at: databaseURL)
    let secondRun = try await runner.bootstrapDatabase(at: databaseURL)

    XCTAssertTrue(secondRun.appliedMigrations.isEmpty)
    XCTAssertEqual(secondRun.skippedMigrations.count, 5)
  }

  private func makeTemporaryDatabaseURL() throws -> URL {
    let directory = FileManager.default.temporaryDirectory
      .appendingPathComponent("serenity-macos-tests")
      .appendingPathComponent(UUID().uuidString, isDirectory: true)

    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

    return directory.appendingPathComponent("serenity.sqlite3")
  }
}
