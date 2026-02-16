import Foundation
import XCTest
@testable import SerenityMac

final class FeatureParityRegressionTests: XCTestCase {
  func testCoreCrudParityAcrossTasksProjectsJournalAndGoals() async throws {
    let adapter = try makeSQLiteAdapter()
    _ = try await adapter.bootstrap()
    let core = try adapter.makeCoreRepositories()
    let now = Date()

    let project = ProjectEntity(
      id: "parity-project",
      name: "Parity Project",
      description: "Regression",
      color: "#224488",
      icon: nil,
      createdAt: now,
      updatedAt: now,
      archived: false,
      userId: nil
    )
    try core.projects.save(project)

    var task = TaskEntity(
      id: "parity-task",
      title: "Parity Task",
      description: "Verify full CRUD",
      completed: false,
      completedAt: nil,
      priority: .high,
      dueDate: now,
      projectId: project.id,
      tags: ["parity", "today"],
      createdAt: now,
      updatedAt: now,
      subtasks: [TaskSubtask(id: "sub-1", title: "Subtask", completed: false, order: 0)],
      recurring: nil,
      userId: nil
    )
    try core.tasks.save(task)

    task.completed = true
    task.completedAt = now
    task.updatedAt = now.addingTimeInterval(30)
    try core.tasks.save(task)

    let journal = JournalEntryEntity(
      id: "parity-journal",
      title: "Parity Journal",
      content: "Daily check-in",
      date: now,
      tags: ["parity"],
      createdAt: now,
      updatedAt: now,
      pinned: true,
      mood: .neutral,
      attachments: [],
      userId: nil
    )
    try core.journal.save(journal)

    let goal = GoalEntity(
      id: "parity-goal",
      title: "Parity Goal",
      description: nil,
      type: .weeklyTasks,
      config: GoalConfig(targetCount: 4, projectId: project.id, priority: .high, streakDays: nil, targetRate: nil, timeframe: .weekly),
      progress: GoalProgress(current: 1, target: 4, percentage: 25, isCompleted: false, periodStart: now, periodEnd: now),
      status: .active,
      priority: .high,
      reminders: [],
      createdAt: now,
      updatedAt: now,
      userId: nil
    )
    try core.goals.save(goal)

    XCTAssertEqual(try core.tasks.fetchAll().count, 1)
    XCTAssertEqual(try core.projects.fetchAll(includeArchived: false).count, 1)
    XCTAssertEqual(try core.journal.fetchAll().count, 1)
    XCTAssertEqual(try core.goals.fetchActive().count, 1)

    try core.tasks.delete(id: "parity-task")
    try core.projects.delete(id: "parity-project")
    try core.journal.delete(id: "parity-journal")
    try core.goals.delete(id: "parity-goal")

    XCTAssertTrue(try core.tasks.fetchAll().isEmpty)
    XCTAssertTrue(try core.projects.fetchAll(includeArchived: true).isEmpty)
    XCTAssertTrue(try core.journal.fetchAll().isEmpty)
    XCTAssertTrue(try core.goals.fetchAll().isEmpty)
  }

  @MainActor
  func testAppStateParityFlowForActionHubTodayJournalGoalsAndSearch() async throws {
    let adapter = try makeSQLiteAdapter()
    let suiteName = "serenity.parity.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer {
      defaults.removePersistentDomain(forName: suiteName)
    }

    let registry = BackendProfileRegistry(
      descriptors: BackendProfileRegistry.live.descriptors,
      validators: [
        .sqliteLocal: { .available(message: "ok") },
        .serenityCloud: { .unavailable(reason: "not configured") },
        .externalPostgres: { .unavailable(reason: "not configured") },
      ]
    )

    let state = AppState(
      backendProfileManager: BackendProfileManager(
        defaults: defaults,
        defaultsKey: "parity.backend",
        registry: registry
      ),
      sqliteBackendAdapter: adapter,
      serenityCloudAdapter: nil,
      externalPostgresAdapter: nil
    )

    await state.bootstrapLocalDatabase()
    await state.refreshCoreWorkflowData()

    await state.createProject(name: "Parity AppState Project", description: "Project flow", color: "#004488")
    await state.createTask(title: "Parity Task", priority: .medium, dueDate: Date(), tags: ["parity"], subtaskTitles: ["child"])
    await state.createJournalEntry(title: "Parity Entry", content: "Journal flow", mood: .happy, tags: ["parity"])
    await state.createGoal(title: "Parity Goal", target: 3, type: .weeklyTasks, priority: .medium)

    await state.refreshCoreWorkflowData()

    XCTAssertFalse(state.projects.isEmpty)
    XCTAssertFalse(state.tasks.isEmpty)
    XCTAssertFalse(state.todayTasks.isEmpty)
    XCTAssertFalse(state.journalEntries.isEmpty)
    XCTAssertFalse(state.goals.isEmpty)

    state.setGlobalSearchQuery("Parity")
    XCTAssertFalse(state.globalSearchResults.isEmpty)
  }

  private func makeSQLiteAdapter() throws -> SQLiteBackendAdapter {
    let baseURL = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
      .appendingPathComponent("serenity-parity-tests-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: baseURL, withIntermediateDirectories: true)
    return SQLiteBackendAdapter(databaseURL: baseURL.appendingPathComponent("serenity.sqlite"))
  }
}

