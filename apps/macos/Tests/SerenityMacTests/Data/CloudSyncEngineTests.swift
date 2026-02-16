import Foundation
import XCTest
@testable import SerenityMac

final class CloudSyncEngineTests: XCTestCase {
  func testSyncPushesLocalEntitiesToRemoteWhenMissing() async throws {
    let sqliteAdapter = try makeSQLiteAdapter()
    _ = try await sqliteAdapter.bootstrap()
    let core = try sqliteAdapter.makeCoreRepositories()

    let now = Date()
    try core.tasks.save(
      TaskEntity(
        id: "task-1",
        title: "Task",
        description: nil,
        completed: false,
        completedAt: nil,
        priority: .medium,
        dueDate: nil,
        projectId: nil,
        tags: [],
        createdAt: now,
        updatedAt: now,
        subtasks: [],
        recurring: nil,
        userId: nil
      )
    )

    try core.projects.save(
      ProjectEntity(
        id: "project-1",
        name: "Project",
        description: nil,
        color: "#000000",
        icon: nil,
        createdAt: now,
        updatedAt: now,
        archived: false,
        userId: nil
      )
    )

    try core.journal.save(
      JournalEntryEntity(
        id: "journal-1",
        title: "Entry",
        content: "Content",
        date: now,
        tags: [],
        createdAt: now,
        updatedAt: now,
        pinned: false,
        mood: nil,
        attachments: [],
        userId: nil
      )
    )

    let goal = GoalEntity(
      id: "goal-1",
      title: "Goal",
      description: nil,
      type: .weeklyTasks,
      config: GoalConfig(targetCount: 5, projectId: nil, priority: nil, streakDays: nil, targetRate: nil, timeframe: .weekly),
      progress: GoalProgress(current: 1, target: 5, percentage: 20, isCompleted: false, periodStart: now, periodEnd: now),
      status: .active,
      priority: .medium,
      reminders: [],
      createdAt: now,
      updatedAt: now,
      userId: nil
    )
    try core.goals.save(goal)

    let remote = InMemoryCloudSyncRemoteBackend()
    let engine = CloudSyncEngine(sqliteBackendAdapter: sqliteAdapter, remoteBackend: remote)
    let result = try await engine.syncAllEntities(policy: .preferNewest)

    XCTAssertEqual(result.pushedTasks, 1)
    XCTAssertEqual(result.pushedProjects, 1)
    XCTAssertEqual(result.pushedJournal, 1)
    XCTAssertEqual(result.pushedGoals, 1)
    XCTAssertTrue(result.conflicts.isEmpty)

    let remoteTasks = try await remote.listTasks()
    XCTAssertEqual(remoteTasks.count, 1)
    XCTAssertEqual(remoteTasks.first?.id, "task-1")
  }

  func testConflictDetectionAndResolutionFlow() async throws {
    let sqliteAdapter = try makeSQLiteAdapter()
    _ = try await sqliteAdapter.bootstrap()
    let core = try sqliteAdapter.makeCoreRepositories()

    let now = Date()
    let localTask = TaskEntity(
      id: "task-conflict",
      title: "Local title",
      description: nil,
      completed: false,
      completedAt: nil,
      priority: .medium,
      dueDate: nil,
      projectId: nil,
      tags: [],
      createdAt: now,
      updatedAt: now,
      subtasks: [],
      recurring: nil,
      userId: nil
    )
    try core.tasks.save(localTask)

    let remoteTask = TaskEntity(
      id: "task-conflict",
      title: "Remote title",
      description: nil,
      completed: false,
      completedAt: nil,
      priority: .medium,
      dueDate: nil,
      projectId: nil,
      tags: [],
      createdAt: now,
      updatedAt: now.addingTimeInterval(120),
      subtasks: [],
      recurring: nil,
      userId: nil
    )

    let remote = InMemoryCloudSyncRemoteBackend(tasks: [remoteTask])
    let engine = CloudSyncEngine(sqliteBackendAdapter: sqliteAdapter, remoteBackend: remote)
    let result = try await engine.syncAllEntities(policy: .deferConflicts)

    XCTAssertEqual(result.conflicts.count, 1)
    XCTAssertEqual(result.conflicts.first?.entityType, .tasks)

    if let conflict = result.conflicts.first {
      try await engine.resolveConflict(conflict, policy: .preferRemote)
    }

    let updatedLocal = try core.tasks.fetchByID("task-conflict")
    XCTAssertEqual(updatedLocal?.title, "Remote title")
  }

  private func makeSQLiteAdapter() throws -> SQLiteBackendAdapter {
    let baseURL = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
      .appendingPathComponent("serenity-cloud-sync-tests-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: baseURL, withIntermediateDirectories: true)
    return SQLiteBackendAdapter(databaseURL: baseURL.appendingPathComponent("serenity.sqlite"))
  }
}

private actor InMemoryCloudSyncRemoteBackend: CloudSyncRemoteBackend {
  private var tasksStore: [String: TaskEntity]
  private var projectsStore: [String: ProjectEntity]
  private var journalStore: [String: JournalEntryEntity]
  private var goalsStore: [String: GoalEntity]

  init(
    tasks: [TaskEntity] = [],
    projects: [ProjectEntity] = [],
    journal: [JournalEntryEntity] = [],
    goals: [GoalEntity] = []
  ) {
    self.tasksStore = Dictionary(uniqueKeysWithValues: tasks.map { ($0.id, $0) })
    self.projectsStore = Dictionary(uniqueKeysWithValues: projects.map { ($0.id, $0) })
    self.journalStore = Dictionary(uniqueKeysWithValues: journal.map { ($0.id, $0) })
    self.goalsStore = Dictionary(uniqueKeysWithValues: goals.map { ($0.id, $0) })
  }

  func listTasks() async throws -> [TaskEntity] {
    Array(tasksStore.values)
  }

  func createTask(_ task: TaskEntity) async throws -> TaskEntity {
    tasksStore[task.id] = task
    return task
  }

  func updateTask(_ task: TaskEntity) async throws -> TaskEntity {
    tasksStore[task.id] = task
    return task
  }

  func listProjects() async throws -> [ProjectEntity] {
    Array(projectsStore.values)
  }

  func createProject(_ project: ProjectEntity) async throws -> ProjectEntity {
    projectsStore[project.id] = project
    return project
  }

  func updateProject(_ project: ProjectEntity) async throws -> ProjectEntity {
    projectsStore[project.id] = project
    return project
  }

  func listJournalEntries() async throws -> [JournalEntryEntity] {
    Array(journalStore.values)
  }

  func createJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity {
    journalStore[entry.id] = entry
    return entry
  }

  func updateJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity {
    journalStore[entry.id] = entry
    return entry
  }

  func listGoals() async throws -> [GoalEntity] {
    Array(goalsStore.values)
  }

  func createGoal(_ goal: GoalEntity) async throws -> GoalEntity {
    goalsStore[goal.id] = goal
    return goal
  }

  func updateGoal(_ goal: GoalEntity) async throws -> GoalEntity {
    goalsStore[goal.id] = goal
    return goal
  }
}

