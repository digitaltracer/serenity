import Foundation

enum CloudSyncEntityType: String, CaseIterable, Sendable {
  case tasks
  case projects
  case journal
  case goals
}

enum CloudSyncResolutionPolicy: String, CaseIterable, Sendable {
  case deferConflicts
  case preferNewest
  case preferLocal
  case preferRemote
}

struct CloudSyncConflict: Identifiable, Equatable, Sendable {
  let entityType: CloudSyncEntityType
  let entityID: String
  let localUpdatedAt: Date
  let remoteUpdatedAt: Date
  let summary: String

  var id: String { "\(entityType.rawValue):\(entityID)" }
}

struct CloudSyncRetryPolicy: Sendable {
  let maxAttempts: Int
  let initialDelayMilliseconds: UInt64

  static let `default` = CloudSyncRetryPolicy(maxAttempts: 3, initialDelayMilliseconds: 120)
}

struct CloudSyncResult: Equatable, Sendable {
  var pulledTasks = 0
  var pushedTasks = 0
  var pulledProjects = 0
  var pushedProjects = 0
  var pulledJournal = 0
  var pushedJournal = 0
  var pulledGoals = 0
  var pushedGoals = 0
  var conflicts: [CloudSyncConflict] = []

  var summaryLine: String {
    "Pulled \(pulledTasks + pulledProjects + pulledJournal + pulledGoals), pushed \(pushedTasks + pushedProjects + pushedJournal + pushedGoals), conflicts \(conflicts.count)"
  }
}

protocol CloudSyncRemoteBackend {
  func listTasks() async throws -> [TaskEntity]
  func createTask(_ task: TaskEntity) async throws -> TaskEntity
  func updateTask(_ task: TaskEntity) async throws -> TaskEntity

  func listProjects() async throws -> [ProjectEntity]
  func createProject(_ project: ProjectEntity) async throws -> ProjectEntity
  func updateProject(_ project: ProjectEntity) async throws -> ProjectEntity

  func listJournalEntries() async throws -> [JournalEntryEntity]
  func createJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity
  func updateJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity

  func listGoals() async throws -> [GoalEntity]
  func createGoal(_ goal: GoalEntity) async throws -> GoalEntity
  func updateGoal(_ goal: GoalEntity) async throws -> GoalEntity
}

extension SerenityCloudAdapter: CloudSyncRemoteBackend {}

actor CloudSyncEngine {
  private let sqliteBackendAdapter: SQLiteBackendAdapter
  private let remoteBackend: CloudSyncRemoteBackend
  private let retryPolicy: CloudSyncRetryPolicy
  private var idempotencyLedger: Set<String> = []

  init(
    sqliteBackendAdapter: SQLiteBackendAdapter,
    remoteBackend: CloudSyncRemoteBackend,
    retryPolicy: CloudSyncRetryPolicy = .default
  ) {
    self.sqliteBackendAdapter = sqliteBackendAdapter
    self.remoteBackend = remoteBackend
    self.retryPolicy = retryPolicy
  }

  func syncAllEntities(policy: CloudSyncResolutionPolicy = .deferConflicts) async throws -> CloudSyncResult {
    _ = try await sqliteBackendAdapter.bootstrap()
    let core = try sqliteBackendAdapter.makeCoreRepositories()

    idempotencyLedger.removeAll()
    var result = CloudSyncResult()

    let remoteTasks = try await withRetry("list-tasks") { try await remoteBackend.listTasks() }
    let localTasks = try core.tasks.fetchAll()
    try await reconcileTasks(local: localTasks, remote: remoteTasks, core: core, policy: policy, result: &result)

    let remoteProjects = try await withRetry("list-projects") { try await remoteBackend.listProjects() }
    let localProjects = try core.projects.fetchAll(includeArchived: true)
    try await reconcileProjects(local: localProjects, remote: remoteProjects, core: core, policy: policy, result: &result)

    let remoteJournal = try await withRetry("list-journal") { try await remoteBackend.listJournalEntries() }
    let localJournal = try core.journal.fetchAll()
    try await reconcileJournal(local: localJournal, remote: remoteJournal, core: core, policy: policy, result: &result)

    let remoteGoals = try await withRetry("list-goals") { try await remoteBackend.listGoals() }
    let localGoals = try core.goals.fetchAll()
    try await reconcileGoals(local: localGoals, remote: remoteGoals, core: core, policy: policy, result: &result)

    return result
  }

  func resolveConflict(_ conflict: CloudSyncConflict, policy: CloudSyncResolutionPolicy) async throws {
    let effectivePolicy: CloudSyncResolutionPolicy = {
      switch policy {
      case .deferConflicts:
        return .preferNewest
      default:
        return policy
      }
    }()

    _ = try await sqliteBackendAdapter.bootstrap()
    let core = try sqliteBackendAdapter.makeCoreRepositories()

    switch conflict.entityType {
    case .tasks:
      let local = try core.tasks.fetchByID(conflict.entityID)
      let remote = try await remoteBackend.listTasks().first(where: { $0.id == conflict.entityID })
      try await resolveTask(local: local, remote: remote, core: core, policy: effectivePolicy)
    case .projects:
      let local = try core.projects.fetchByID(conflict.entityID)
      let remote = try await remoteBackend.listProjects().first(where: { $0.id == conflict.entityID })
      try await resolveProject(local: local, remote: remote, core: core, policy: effectivePolicy)
    case .journal:
      let local = try core.journal.fetchByID(conflict.entityID)
      let remote = try await remoteBackend.listJournalEntries().first(where: { $0.id == conflict.entityID })
      try await resolveJournal(local: local, remote: remote, core: core, policy: effectivePolicy)
    case .goals:
      let local = try core.goals.fetchByID(conflict.entityID)
      let remote = try await remoteBackend.listGoals().first(where: { $0.id == conflict.entityID })
      try await resolveGoal(local: local, remote: remote, core: core, policy: effectivePolicy)
    }
  }

  private func reconcileTasks(
    local: [TaskEntity],
    remote: [TaskEntity],
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy,
    result: inout CloudSyncResult
  ) async throws {
    let localByID = Dictionary(uniqueKeysWithValues: local.map { ($0.id, $0) })
    let remoteByID = Dictionary(uniqueKeysWithValues: remote.map { ($0.id, $0) })
    let allIDs = Set(localByID.keys).union(remoteByID.keys)

    for id in allIDs {
      let localValue = localByID[id]
      let remoteValue = remoteByID[id]

      switch (localValue, remoteValue) {
      case (nil, .some(let remoteTask)):
        try core.tasks.save(remoteTask)
        result.pulledTasks += 1
      case (.some(let localTask), nil):
        try await runIdempotentOperation("push-task-\(localTask.id)") {
          _ = try await withRetry("create-task-\(localTask.id)") { try await remoteBackend.createTask(localTask) }
        }
        result.pushedTasks += 1
      case (.some(let localTask), .some(let remoteTask)):
        if localTask == remoteTask { continue }
        if policy == .deferConflicts {
          result.conflicts.append(
            CloudSyncConflict(
              entityType: .tasks,
              entityID: localTask.id,
              localUpdatedAt: localTask.updatedAt,
              remoteUpdatedAt: remoteTask.updatedAt,
              summary: localTask.title
            )
          )
          continue
        }

        let winner = resolveWinner(local: localTask, remote: remoteTask, policy: policy)
        if winner == .local {
          try await runIdempotentOperation("update-task-\(localTask.id)") {
            _ = try await withRetry("update-task-\(localTask.id)") { try await remoteBackend.updateTask(localTask) }
          }
          result.pushedTasks += 1
        } else {
          try core.tasks.save(remoteTask)
          result.pulledTasks += 1
        }
      default:
        break
      }
    }
  }

  private func reconcileProjects(
    local: [ProjectEntity],
    remote: [ProjectEntity],
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy,
    result: inout CloudSyncResult
  ) async throws {
    let localByID = Dictionary(uniqueKeysWithValues: local.map { ($0.id, $0) })
    let remoteByID = Dictionary(uniqueKeysWithValues: remote.map { ($0.id, $0) })
    let allIDs = Set(localByID.keys).union(remoteByID.keys)

    for id in allIDs {
      let localValue = localByID[id]
      let remoteValue = remoteByID[id]

      switch (localValue, remoteValue) {
      case (nil, .some(let remoteProject)):
        try core.projects.save(remoteProject)
        result.pulledProjects += 1
      case (.some(let localProject), nil):
        try await runIdempotentOperation("push-project-\(localProject.id)") {
          _ = try await withRetry("create-project-\(localProject.id)") { try await remoteBackend.createProject(localProject) }
        }
        result.pushedProjects += 1
      case (.some(let localProject), .some(let remoteProject)):
        if localProject == remoteProject { continue }
        if policy == .deferConflicts {
          result.conflicts.append(
            CloudSyncConflict(
              entityType: .projects,
              entityID: localProject.id,
              localUpdatedAt: localProject.updatedAt,
              remoteUpdatedAt: remoteProject.updatedAt,
              summary: localProject.name
            )
          )
          continue
        }

        let winner = resolveWinner(local: localProject, remote: remoteProject, policy: policy)
        if winner == .local {
          try await runIdempotentOperation("update-project-\(localProject.id)") {
            _ = try await withRetry("update-project-\(localProject.id)") { try await remoteBackend.updateProject(localProject) }
          }
          result.pushedProjects += 1
        } else {
          try core.projects.save(remoteProject)
          result.pulledProjects += 1
        }
      default:
        break
      }
    }
  }

  private func reconcileJournal(
    local: [JournalEntryEntity],
    remote: [JournalEntryEntity],
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy,
    result: inout CloudSyncResult
  ) async throws {
    let localByID = Dictionary(uniqueKeysWithValues: local.map { ($0.id, $0) })
    let remoteByID = Dictionary(uniqueKeysWithValues: remote.map { ($0.id, $0) })
    let allIDs = Set(localByID.keys).union(remoteByID.keys)

    for id in allIDs {
      let localValue = localByID[id]
      let remoteValue = remoteByID[id]

      switch (localValue, remoteValue) {
      case (nil, .some(let remoteEntry)):
        try core.journal.save(remoteEntry)
        result.pulledJournal += 1
      case (.some(let localEntry), nil):
        try await runIdempotentOperation("push-journal-\(localEntry.id)") {
          _ = try await withRetry("create-journal-\(localEntry.id)") { try await remoteBackend.createJournalEntry(localEntry) }
        }
        result.pushedJournal += 1
      case (.some(let localEntry), .some(let remoteEntry)):
        if localEntry == remoteEntry { continue }
        if policy == .deferConflicts {
          result.conflicts.append(
            CloudSyncConflict(
              entityType: .journal,
              entityID: localEntry.id,
              localUpdatedAt: localEntry.updatedAt,
              remoteUpdatedAt: remoteEntry.updatedAt,
              summary: localEntry.title ?? "Journal entry"
            )
          )
          continue
        }

        let winner = resolveWinner(local: localEntry, remote: remoteEntry, policy: policy)
        if winner == .local {
          try await runIdempotentOperation("update-journal-\(localEntry.id)") {
            _ = try await withRetry("update-journal-\(localEntry.id)") { try await remoteBackend.updateJournalEntry(localEntry) }
          }
          result.pushedJournal += 1
        } else {
          try core.journal.save(remoteEntry)
          result.pulledJournal += 1
        }
      default:
        break
      }
    }
  }

  private func reconcileGoals(
    local: [GoalEntity],
    remote: [GoalEntity],
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy,
    result: inout CloudSyncResult
  ) async throws {
    let localByID = Dictionary(uniqueKeysWithValues: local.map { ($0.id, $0) })
    let remoteByID = Dictionary(uniqueKeysWithValues: remote.map { ($0.id, $0) })
    let allIDs = Set(localByID.keys).union(remoteByID.keys)

    for id in allIDs {
      let localValue = localByID[id]
      let remoteValue = remoteByID[id]

      switch (localValue, remoteValue) {
      case (nil, .some(let remoteGoal)):
        try core.goals.save(remoteGoal)
        result.pulledGoals += 1
      case (.some(let localGoal), nil):
        try await runIdempotentOperation("push-goal-\(localGoal.id)") {
          _ = try await withRetry("create-goal-\(localGoal.id)") { try await remoteBackend.createGoal(localGoal) }
        }
        result.pushedGoals += 1
      case (.some(let localGoal), .some(let remoteGoal)):
        if localGoal == remoteGoal { continue }
        if policy == .deferConflicts {
          result.conflicts.append(
            CloudSyncConflict(
              entityType: .goals,
              entityID: localGoal.id,
              localUpdatedAt: localGoal.updatedAt,
              remoteUpdatedAt: remoteGoal.updatedAt,
              summary: localGoal.title
            )
          )
          continue
        }

        let winner = resolveWinner(local: localGoal, remote: remoteGoal, policy: policy)
        if winner == .local {
          try await runIdempotentOperation("update-goal-\(localGoal.id)") {
            _ = try await withRetry("update-goal-\(localGoal.id)") { try await remoteBackend.updateGoal(localGoal) }
          }
          result.pushedGoals += 1
        } else {
          try core.goals.save(remoteGoal)
          result.pulledGoals += 1
        }
      default:
        break
      }
    }
  }

  private func resolveTask(
    local: TaskEntity?,
    remote: TaskEntity?,
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy
  ) async throws {
    guard let local, let remote else { return }
    let winner = resolveWinner(local: local, remote: remote, policy: policy)
    if winner == .local {
      _ = try await remoteBackend.updateTask(local)
    } else {
      try core.tasks.save(remote)
    }
  }

  private func resolveProject(
    local: ProjectEntity?,
    remote: ProjectEntity?,
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy
  ) async throws {
    guard let local, let remote else { return }
    let winner = resolveWinner(local: local, remote: remote, policy: policy)
    if winner == .local {
      _ = try await remoteBackend.updateProject(local)
    } else {
      try core.projects.save(remote)
    }
  }

  private func resolveJournal(
    local: JournalEntryEntity?,
    remote: JournalEntryEntity?,
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy
  ) async throws {
    guard let local, let remote else { return }
    let winner = resolveWinner(local: local, remote: remote, policy: policy)
    if winner == .local {
      _ = try await remoteBackend.updateJournalEntry(local)
    } else {
      try core.journal.save(remote)
    }
  }

  private func resolveGoal(
    local: GoalEntity?,
    remote: GoalEntity?,
    core: GRDBCoreRepositorySet,
    policy: CloudSyncResolutionPolicy
  ) async throws {
    guard let local, let remote else { return }
    let winner = resolveWinner(local: local, remote: remote, policy: policy)
    if winner == .local {
      _ = try await remoteBackend.updateGoal(local)
    } else {
      try core.goals.save(remote)
    }
  }

  private enum Winner {
    case local
    case remote
  }

  private func resolveWinner<T>(local: T, remote: T, policy: CloudSyncResolutionPolicy) -> Winner where T: UpdatedAtEntity {
    switch policy {
    case .preferLocal:
      return .local
    case .preferRemote:
      return .remote
    case .preferNewest, .deferConflicts:
      return local.updatedAt >= remote.updatedAt ? .local : .remote
    }
  }

  private func withRetry<T>(_ operationID: String, operation: () async throws -> T) async throws -> T {
    var attempt = 0
    var lastError: Error?

    while attempt < retryPolicy.maxAttempts {
      do {
        return try await operation()
      } catch {
        lastError = error
        attempt += 1
        if attempt >= retryPolicy.maxAttempts {
          break
        }

        let delay = retryPolicy.initialDelayMilliseconds * UInt64(1 << (attempt - 1))
        try await Task.sleep(nanoseconds: delay * 1_000_000)
      }
    }

    throw lastError ?? NSError(domain: "CloudSyncEngine", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unknown sync error for \(operationID)"])
  }

  private func runIdempotentOperation(_ operationID: String, block: () async throws -> Void) async throws {
    guard !idempotencyLedger.contains(operationID) else { return }
    try await block()
    idempotencyLedger.insert(operationID)
  }
}

private protocol UpdatedAtEntity {
  var updatedAt: Date { get }
}

extension TaskEntity: UpdatedAtEntity {}
extension ProjectEntity: UpdatedAtEntity {}
extension JournalEntryEntity: UpdatedAtEntity {}
extension GoalEntity: UpdatedAtEntity {}
