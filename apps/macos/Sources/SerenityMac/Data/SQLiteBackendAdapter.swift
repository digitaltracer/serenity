import Foundation
import GRDB

struct SQLiteBackendDiagnostics: Equatable, Sendable {
  let databasePath: String
  let isBootstrapped: Bool
}

struct SQLiteBackupSummary: Equatable, Sendable {
  let sourcePath: String
  let backupPath: String
}

final class SQLiteBackendAdapter {
  let profile: BackendProfile = .sqliteLocal

  private let migrationRunner: DatabaseMigrationRunner
  private var configuredDatabaseURL: URL?
  private var lastBootstrapPath: String?

  init(
    migrationRunner: DatabaseMigrationRunner = DatabaseMigrationRunner(),
    databaseURL: URL? = nil
  ) {
    self.migrationRunner = migrationRunner
    self.configuredDatabaseURL = databaseURL
  }

  func bootstrap() async throws -> MigrationRunSummary {
    let databaseURL = try configuredDatabaseURL ?? DatabaseMigrationRunner.defaultDatabaseURL()
    configuredDatabaseURL = databaseURL

    let summary = try await migrationRunner.bootstrapDatabase(at: databaseURL)
    lastBootstrapPath = summary.databasePath
    return summary
  }

  func makeCoreRepositories() throws -> GRDBCoreRepositorySet {
    try GRDBCoreRepositorySet.make(databasePath: try requireDatabasePath())
  }

  func makeAIRepositories() throws -> GRDBAIRepositorySet {
    try GRDBAIRepositorySet.make(databasePath: try requireDatabasePath())
  }

  func makeSecurityAuditRepository() throws -> GRDBSecurityAuditRepository {
    var configuration = Configuration()
    configuration.prepareDatabase { db in
      try db.execute(sql: "PRAGMA foreign_keys = ON")
    }

    let dbQueue = try DatabaseQueue(path: try requireDatabasePath(), configuration: configuration)
    return GRDBSecurityAuditRepository(dbQueue: dbQueue)
  }

  func diagnostics() throws -> SQLiteBackendDiagnostics {
    let path = try requireDatabasePath()
    return SQLiteBackendDiagnostics(databasePath: path, isBootstrapped: lastBootstrapPath != nil)
  }

  func currentDatabasePath() throws -> String {
    try requireDatabasePath()
  }

  func runQuickIntegrityCheck() throws -> String {
    var configuration = Configuration()
    configuration.prepareDatabase { db in
      try db.execute(sql: "PRAGMA foreign_keys = ON")
    }

    let dbQueue = try DatabaseQueue(path: try requireDatabasePath(), configuration: configuration)
    return try dbQueue.read { db in
      try String.fetchOne(db, sql: "PRAGMA quick_check;") ?? "unknown"
    }
  }

  func createBackup() throws -> SQLiteBackupSummary {
    let sourcePath = try requireDatabasePath()
    let sourceURL = URL(fileURLWithPath: sourcePath)

    let backupsDirectory = FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Application Support/Serenity/backups", isDirectory: true)
    try FileManager.default.createDirectory(at: backupsDirectory, withIntermediateDirectories: true)

    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyyMMdd-HHmmss"
    let timestamp = formatter.string(from: Date())

    let destinationURL = backupsDirectory.appendingPathComponent("serenity-\(timestamp).sqlite")
    if FileManager.default.fileExists(atPath: destinationURL.path) {
      try FileManager.default.removeItem(at: destinationURL)
    }

    try FileManager.default.copyItem(at: sourceURL, to: destinationURL)
    return SQLiteBackupSummary(sourcePath: sourceURL.path, backupPath: destinationURL.path)
  }

  private func requireDatabasePath() throws -> String {
    if let lastBootstrapPath {
      return lastBootstrapPath
    }

    if let configuredDatabaseURL {
      return configuredDatabaseURL.path
    }

    return try DatabaseMigrationRunner.defaultDatabaseURL().path
  }
}
