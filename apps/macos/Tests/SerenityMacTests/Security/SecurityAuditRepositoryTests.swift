import Foundation
import XCTest
@testable import SerenityMac

final class SecurityAuditRepositoryTests: XCTestCase {
  func testSaveAndFetchRecentSecurityEvents() async throws {
    let databaseURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("serenity-macos-security-audit")
      .appendingPathComponent(UUID().uuidString, isDirectory: true)
      .appendingPathComponent("serenity.sqlite3")

    let adapter = SQLiteBackendAdapter(databaseURL: databaseURL)
    _ = try await adapter.bootstrap()
    let repository = try adapter.makeSecurityAuditRepository()

    let event = SecurityAuditEvent(
      id: UUID().uuidString,
      eventType: .authentication,
      severity: .info,
      message: "Signed in",
      metadata: ["provider": "oauth"],
      createdAt: Date()
    )

    try repository.save(event)
    let recent = try repository.fetchRecent(limit: 10)

    XCTAssertEqual(recent.count, 1)
    XCTAssertEqual(recent.first?.eventType, .authentication)
    XCTAssertEqual(recent.first?.metadata["provider"], "oauth")
  }
}
