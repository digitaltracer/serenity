import Foundation
import XCTest
@testable import SerenityMac

final class PerformanceBenchmarksTests: XCTestCase {
  func testLargeDatasetRepositoryPerformance() async throws {
    let adapter = try makeSQLiteAdapter()
    _ = try await adapter.bootstrap()
    let core = try adapter.makeCoreRepositories()

    let now = Date()
    let total = 2_000

    let started = Date()
    for index in 0..<total {
      let task = TaskEntity(
        id: "perf-task-\(index)",
        title: "Perf Task \(index)",
        description: "Benchmark payload",
        completed: index.isMultiple(of: 3),
        completedAt: index.isMultiple(of: 3) ? now : nil,
        priority: index.isMultiple(of: 5) ? .high : .medium,
        dueDate: now.addingTimeInterval(TimeInterval(index * 60)),
        projectId: nil,
        tags: ["perf", "batch"],
        createdAt: now,
        updatedAt: now,
        subtasks: [],
        recurring: nil,
        userId: nil
      )
      try core.tasks.save(task)
    }
    let insertDuration = Date().timeIntervalSince(started)

    let readStarted = Date()
    let allTasks = try core.tasks.fetchAll()
    let readDuration = Date().timeIntervalSince(readStarted)

    XCTAssertEqual(allTasks.count, total)
    XCTAssertLessThan(insertDuration, 8.0)
    XCTAssertLessThan(readDuration, 2.0)
  }

  private func makeSQLiteAdapter() throws -> SQLiteBackendAdapter {
    let baseURL = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
      .appendingPathComponent("serenity-perf-tests-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: baseURL, withIntermediateDirectories: true)
    return SQLiteBackendAdapter(databaseURL: baseURL.appendingPathComponent("serenity.sqlite"))
  }
}

