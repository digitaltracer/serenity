import Foundation
import GRDB

enum SecurityAuditSeverity: String, Codable, CaseIterable, Sendable {
  case info
  case warning
  case critical
}

enum SecurityAuditEventType: String, Codable, CaseIterable, Sendable {
  case backendSwitch
  case authentication
  case localLock
  case biometricUnlock
  case secretAccess
  case securityPolicy
}

struct SecurityAuditEvent: Identifiable, Equatable, Sendable {
  let id: String
  let eventType: SecurityAuditEventType
  let severity: SecurityAuditSeverity
  let message: String
  let metadata: [String: String]
  let createdAt: Date
}

protocol SecurityAuditRepository {
  func save(_ event: SecurityAuditEvent) throws
  func fetchRecent(limit: Int) throws -> [SecurityAuditEvent]
}

final class GRDBSecurityAuditRepository: SecurityAuditRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func save(_ event: SecurityAuditEvent) throws {
    let metadataJSON = try CoreRepositoryCodec.encodeJSON(event.metadata)
    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO security_audit_events (
          id,
          event_type,
          severity,
          message,
          metadata_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?);
        """,
        arguments: [
          event.id,
          event.eventType.rawValue,
          event.severity.rawValue,
          event.message,
          metadataJSON,
          CoreRepositoryCodec.encodeDate(event.createdAt),
        ]
      )
    }
  }

  func fetchRecent(limit: Int = 100) throws -> [SecurityAuditEvent] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM security_audit_events ORDER BY created_at DESC LIMIT ?;",
        arguments: [limit]
      )
      return try rows.map(Self.makeEvent(from:))
    }
  }

  private static func makeEvent(from row: Row) throws -> SecurityAuditEvent {
    let metadata = try CoreRepositoryCodec.decodeJSONOrDefault([String: String].self, from: row["metadata_json"], default: [:])
    return SecurityAuditEvent(
      id: row["id"],
      eventType: SecurityAuditEventType(rawValue: (row["event_type"] as String?) ?? SecurityAuditEventType.securityPolicy.rawValue) ?? .securityPolicy,
      severity: SecurityAuditSeverity(rawValue: (row["severity"] as String?) ?? SecurityAuditSeverity.info.rawValue) ?? .info,
      message: row["message"],
      metadata: metadata,
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"])
    )
  }
}

actor SecurityAuditService {
  private let sqliteBackendAdapter: SQLiteBackendAdapter

  init(sqliteBackendAdapter: SQLiteBackendAdapter = SQLiteBackendAdapter()) {
    self.sqliteBackendAdapter = sqliteBackendAdapter
  }

  func record(
    eventType: SecurityAuditEventType,
    severity: SecurityAuditSeverity,
    message: String,
    metadata: [String: String] = [:]
  ) async {
    do {
      _ = try await sqliteBackendAdapter.bootstrap()
      let repository = try sqliteBackendAdapter.makeSecurityAuditRepository()
      try repository.save(
        SecurityAuditEvent(
          id: UUID().uuidString,
          eventType: eventType,
          severity: severity,
          message: message,
          metadata: metadata,
          createdAt: Date()
        )
      )
    } catch {
      AppLogger.error("Failed to persist security audit event: \(error.localizedDescription)")
    }
  }
}
