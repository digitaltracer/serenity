import Foundation
import XCTest
@testable import SerenityMac

final class CoreRepositoriesTests: XCTestCase {
  func testTaskRepositorySaveFetchAndDelete() async throws {
    let repositories = try await makeRepositorySet()
    let now = Date()

    let task = TaskEntity(
      id: UUID().uuidString,
      title: "Ship migration",
      description: "Port repositories",
      completed: false,
      completedAt: nil,
      priority: .high,
      dueDate: now.addingTimeInterval(86_400),
      projectId: nil,
      tags: ["migration", "p2"],
      createdAt: now,
      updatedAt: now,
      subtasks: [TaskSubtask(id: UUID().uuidString, title: "Write tests", completed: false, order: 0)],
      recurring: nil,
      userId: "user-1"
    )

    try repositories.tasks.save(task)

    let saved = try repositories.tasks.fetchByID(task.id)
    XCTAssertNotNil(saved)
    XCTAssertEqual(saved?.title, task.title)
    XCTAssertEqual(saved?.tags, task.tags)
    XCTAssertEqual(saved?.priority, .high)

    try repositories.tasks.delete(id: task.id)
    XCTAssertNil(try repositories.tasks.fetchByID(task.id))
  }

  func testProjectRepositorySupportsArchivedFilter() async throws {
    let repositories = try await makeRepositorySet()
    let now = Date()

    let active = ProjectEntity(
      id: UUID().uuidString,
      name: "Active Project",
      description: nil,
      color: "#33AA77",
      icon: "folder",
      createdAt: now,
      updatedAt: now,
      archived: false,
      userId: nil
    )

    let archived = ProjectEntity(
      id: UUID().uuidString,
      name: "Archived Project",
      description: nil,
      color: "#666666",
      icon: nil,
      createdAt: now,
      updatedAt: now,
      archived: true,
      userId: nil
    )

    try repositories.projects.save(active)
    try repositories.projects.save(archived)

    let all = try repositories.projects.fetchAll(includeArchived: true)
    let activeOnly = try repositories.projects.fetchAll(includeArchived: false)

    XCTAssertEqual(all.count, 2)
    XCTAssertEqual(activeOnly.count, 1)
    XCTAssertEqual(activeOnly.first?.id, active.id)
  }

  func testJournalRepositoryDateRangeQuery() async throws {
    let repositories = try await makeRepositorySet()
    let now = Date()
    let yesterday = now.addingTimeInterval(-86_400)

    let oldEntry = JournalEntryEntity(
      id: UUID().uuidString,
      title: "Yesterday",
      content: "Yesterday entry",
      date: yesterday,
      tags: ["daily"],
      createdAt: yesterday,
      updatedAt: yesterday,
      pinned: false,
      mood: .neutral,
      attachments: [],
      userId: nil
    )

    let currentEntry = JournalEntryEntity(
      id: UUID().uuidString,
      title: "Today",
      content: "Today entry",
      date: now,
      tags: ["daily", "p2"],
      createdAt: now,
      updatedAt: now,
      pinned: true,
      mood: .happy,
      attachments: [],
      userId: nil
    )

    try repositories.journal.save(oldEntry)
    try repositories.journal.save(currentEntry)

    let onlyToday = try repositories.journal.fetch(in: DateInterval(start: now.addingTimeInterval(-600), end: now.addingTimeInterval(600)))

    XCTAssertEqual(onlyToday.count, 1)
    XCTAssertEqual(onlyToday.first?.id, currentEntry.id)
    XCTAssertTrue(onlyToday.first?.pinned ?? false)
  }

  func testGoalRepositorySaveAndFetchActive() async throws {
    let repositories = try await makeRepositorySet()
    let now = Date()

    let activeGoal = GoalEntity(
      id: UUID().uuidString,
      title: "Weekly target",
      description: "Complete 20 tasks",
      type: .weeklyTasks,
      config: GoalConfig(targetCount: 20, projectId: nil, priority: .high, streakDays: nil, targetRate: nil, timeframe: .weekly),
      progress: GoalProgress(current: 5, target: 20, percentage: 25, isCompleted: false, periodStart: now, periodEnd: now.addingTimeInterval(604_800)),
      status: .active,
      priority: .high,
      reminders: [],
      createdAt: now,
      updatedAt: now,
      userId: "user-1"
    )

    let pausedGoal = GoalEntity(
      id: UUID().uuidString,
      title: "Paused",
      description: nil,
      type: .dailyStreak,
      config: GoalConfig(targetCount: nil, projectId: nil, priority: nil, streakDays: 30, targetRate: nil, timeframe: .daily),
      progress: GoalProgress(current: 1, target: 30, percentage: 3.3, isCompleted: false, periodStart: now, periodEnd: now.addingTimeInterval(2_592_000)),
      status: .paused,
      priority: .medium,
      reminders: [],
      createdAt: now,
      updatedAt: now,
      userId: nil
    )

    try repositories.goals.save(activeGoal)
    try repositories.goals.save(pausedGoal)

    let active = try repositories.goals.fetchActive()

    XCTAssertEqual(active.count, 1)
    XCTAssertEqual(active.first?.id, activeGoal.id)
    XCTAssertEqual(active.first?.config.targetCount, 20)
  }

  private func makeRepositorySet() async throws -> GRDBCoreRepositorySet {
    let databaseURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("serenity-macos-repositories")
      .appendingPathComponent(UUID().uuidString, isDirectory: true)
      .appendingPathComponent("serenity.sqlite3")

    let runner = DatabaseMigrationRunner()
    _ = try await runner.bootstrapDatabase(at: databaseURL)

    return try GRDBCoreRepositorySet.make(databasePath: databaseURL.path)
  }
}
