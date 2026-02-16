import Foundation
import GRDB

enum CoreRepositoryError: Error, LocalizedError {
  case invalidDate(String)
  case invalidJSON(String)

  var errorDescription: String? {
    switch self {
    case .invalidDate(let value):
      return "Invalid date value: \(value)"
    case .invalidJSON(let value):
      return "Invalid JSON value: \(value)"
    }
  }
}

enum CoreRepositoryCodec {
  private static let iso8601WithFractional: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()

  private static let iso8601: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
  }()

  private static let sqliteDateTimeWithFractional: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
    return formatter
  }()

  private static let sqliteDateTime: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    return formatter
  }()

  private static let encoder: JSONEncoder = {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    return encoder
  }()

  private static let decoder: JSONDecoder = {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }()

  static func encodeDate(_ value: Date) -> String {
    iso8601WithFractional.string(from: value)
  }

  static func decodeDate(_ value: String?) throws -> Date {
    guard let value else {
      throw CoreRepositoryError.invalidDate("nil")
    }

    if let parsed = iso8601WithFractional.date(from: value) {
      return parsed
    }

    if let parsed = iso8601.date(from: value) {
      return parsed
    }

    if let parsed = sqliteDateTimeWithFractional.date(from: value) {
      return parsed
    }

    if let parsed = sqliteDateTime.date(from: value) {
      return parsed
    }

    throw CoreRepositoryError.invalidDate(value)
  }

  static func decodeOptionalDate(_ value: String?) throws -> Date? {
    guard let value else { return nil }
    return try decodeDate(value)
  }

  static func encodeJSON<T: Encodable>(_ value: T) throws -> String {
    let data = try encoder.encode(value)
    guard let json = String(data: data, encoding: .utf8) else {
      throw CoreRepositoryError.invalidJSON("encoding")
    }

    return json
  }

  static func decodeJSON<T: Decodable>(_ type: T.Type, from value: String?) throws -> T {
    guard let value else {
      throw CoreRepositoryError.invalidJSON("nil")
    }

    guard let data = value.data(using: .utf8) else {
      throw CoreRepositoryError.invalidJSON(value)
    }

    return try decoder.decode(type, from: data)
  }

  static func decodeJSONOrDefault<T: Decodable>(_ type: T.Type, from value: String?, default defaultValue: T) throws -> T {
    guard let value, !value.isEmpty else {
      return defaultValue
    }

    do {
      return try decodeJSON(type, from: value)
    } catch {
      return defaultValue
    }
  }
}

protocol CoreTaskRepository {
  func fetchAll() throws -> [TaskEntity]
  func fetchByID(_ id: String) throws -> TaskEntity?
  func save(_ task: TaskEntity) throws
  func delete(id: String) throws
}

protocol CoreProjectRepository {
  func fetchAll(includeArchived: Bool) throws -> [ProjectEntity]
  func fetchByID(_ id: String) throws -> ProjectEntity?
  func save(_ project: ProjectEntity) throws
  func delete(id: String) throws
}

protocol CoreJournalRepository {
  func fetchAll() throws -> [JournalEntryEntity]
  func fetch(in dateRange: DateInterval) throws -> [JournalEntryEntity]
  func fetchByID(_ id: String) throws -> JournalEntryEntity?
  func save(_ entry: JournalEntryEntity) throws
  func delete(id: String) throws
}

protocol CoreGoalRepository {
  func fetchAll() throws -> [GoalEntity]
  func fetchActive() throws -> [GoalEntity]
  func fetchByID(_ id: String) throws -> GoalEntity?
  func save(_ goal: GoalEntity) throws
  func delete(id: String) throws
}

final class GRDBTaskRepository: CoreTaskRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll() throws -> [TaskEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(db, sql: "SELECT * FROM tasks ORDER BY created_at DESC;")
      return try rows.map(Self.makeTask(from:))
    }
  }

  func fetchByID(_ id: String) throws -> TaskEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM tasks WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeTask(from: row)
    }
  }

  func save(_ task: TaskEntity) throws {
    let tagsJSON = try CoreRepositoryCodec.encodeJSON(task.tags)
    let subtasksJSON = try CoreRepositoryCodec.encodeJSON(task.subtasks)
    let recurringJSON = try task.recurring.map { try CoreRepositoryCodec.encodeJSON($0) }

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO tasks (
          id,
          title,
          notes,
          description,
          completed,
          completed_at,
          priority,
          due_at,
          due_date,
          project_id,
          tags_json,
          subtasks_json,
          recurring_json,
          user_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          notes = excluded.notes,
          description = excluded.description,
          completed = excluded.completed,
          completed_at = excluded.completed_at,
          priority = excluded.priority,
          due_at = excluded.due_at,
          due_date = excluded.due_date,
          project_id = excluded.project_id,
          tags_json = excluded.tags_json,
          subtasks_json = excluded.subtasks_json,
          recurring_json = excluded.recurring_json,
          user_id = excluded.user_id,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          task.id,
          task.title,
          task.description,
          task.description,
          task.completed ? 1 : 0,
          task.completedAt.map(CoreRepositoryCodec.encodeDate),
          task.priority.rawValue,
          task.dueDate.map(CoreRepositoryCodec.encodeDate),
          task.dueDate.map(CoreRepositoryCodec.encodeDate),
          task.projectId,
          tagsJSON,
          subtasksJSON,
          recurringJSON,
          task.userId,
          CoreRepositoryCodec.encodeDate(task.createdAt),
          CoreRepositoryCodec.encodeDate(task.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM tasks WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeTask(from row: Row) throws -> TaskEntity {
    let tags: [String] = try CoreRepositoryCodec.decodeJSONOrDefault([String].self, from: row["tags_json"], default: [])
    let subtasks: [TaskSubtask] = try CoreRepositoryCodec.decodeJSONOrDefault([TaskSubtask].self, from: row["subtasks_json"], default: [])

    let recurringValue: String? = row["recurring_json"]
    let recurring = try recurringValue.flatMap {
      try CoreRepositoryCodec.decodeJSON(TaskRecurringPattern.self, from: $0)
    }

    let dueDate = try CoreRepositoryCodec.decodeOptionalDate((row["due_date"] as String?) ?? (row["due_at"] as String?))

    return TaskEntity(
      id: row["id"],
      title: row["title"],
      description: (row["description"] as String?) ?? (row["notes"] as String?),
      completed: (row["completed"] as Int) == 1,
      completedAt: try CoreRepositoryCodec.decodeOptionalDate(row["completed_at"]),
      priority: TaskPriority(rawValue: (row["priority"] as String?) ?? "medium") ?? .medium,
      dueDate: dueDate,
      projectId: row["project_id"],
      tags: tags,
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"]),
      subtasks: subtasks,
      recurring: recurring,
      userId: row["user_id"]
    )
  }
}

final class GRDBProjectRepository: CoreProjectRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll(includeArchived: Bool = true) throws -> [ProjectEntity] {
    try dbQueue.read { db in
      let rows: [Row]
      if includeArchived {
        rows = try Row.fetchAll(db, sql: "SELECT * FROM projects ORDER BY created_at DESC;")
      } else {
        rows = try Row.fetchAll(db, sql: "SELECT * FROM projects WHERE archived = 0 ORDER BY created_at DESC;")
      }

      return try rows.map(Self.makeProject(from:))
    }
  }

  func fetchByID(_ id: String) throws -> ProjectEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM projects WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeProject(from: row)
    }
  }

  func save(_ project: ProjectEntity) throws {
    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO projects (
          id,
          name,
          description,
          color,
          icon,
          archived,
          user_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          color = excluded.color,
          icon = excluded.icon,
          archived = excluded.archived,
          user_id = excluded.user_id,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          project.id,
          project.name,
          project.description,
          project.color,
          project.icon,
          project.archived ? 1 : 0,
          project.userId,
          CoreRepositoryCodec.encodeDate(project.createdAt),
          CoreRepositoryCodec.encodeDate(project.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM projects WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeProject(from row: Row) throws -> ProjectEntity {
    ProjectEntity(
      id: row["id"],
      name: row["name"],
      description: row["description"],
      color: (row["color"] as String?) ?? "#4A90E2",
      icon: row["icon"],
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"]),
      archived: (row["archived"] as Int) == 1,
      userId: row["user_id"]
    )
  }
}

final class GRDBJournalRepository: CoreJournalRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll() throws -> [JournalEntryEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(db, sql: "SELECT * FROM journal_entries ORDER BY date DESC;")
      return try rows.map(Self.makeEntry(from:))
    }
  }

  func fetch(in dateRange: DateInterval) throws -> [JournalEntryEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date DESC;",
        arguments: [
          CoreRepositoryCodec.encodeDate(dateRange.start),
          CoreRepositoryCodec.encodeDate(dateRange.end),
        ]
      )

      return try rows.map(Self.makeEntry(from:))
    }
  }

  func fetchByID(_ id: String) throws -> JournalEntryEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM journal_entries WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeEntry(from: row)
    }
  }

  func save(_ entry: JournalEntryEntity) throws {
    let tagsJSON = try CoreRepositoryCodec.encodeJSON(entry.tags)
    let attachmentsJSON = try CoreRepositoryCodec.encodeJSON(entry.attachments)

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO journal_entries (
          id,
          title,
          content,
          date,
          tags_json,
          pinned,
          mood,
          attachments_json,
          user_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          date = excluded.date,
          tags_json = excluded.tags_json,
          pinned = excluded.pinned,
          mood = excluded.mood,
          attachments_json = excluded.attachments_json,
          user_id = excluded.user_id,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          entry.id,
          entry.title,
          entry.content,
          CoreRepositoryCodec.encodeDate(entry.date),
          tagsJSON,
          entry.pinned ? 1 : 0,
          entry.mood?.rawValue,
          attachmentsJSON,
          entry.userId,
          CoreRepositoryCodec.encodeDate(entry.createdAt),
          CoreRepositoryCodec.encodeDate(entry.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM journal_entries WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeEntry(from row: Row) throws -> JournalEntryEntity {
    let tags: [String] = try CoreRepositoryCodec.decodeJSONOrDefault([String].self, from: row["tags_json"], default: [])
    let attachments: [JournalAttachmentEntity] = try CoreRepositoryCodec.decodeJSONOrDefault(
      [JournalAttachmentEntity].self,
      from: row["attachments_json"],
      default: []
    )

    let dateValue: String? = row["date"]
    let fallbackDate: String? = row["created_at"]

    return JournalEntryEntity(
      id: row["id"],
      title: row["title"],
      content: row["content"],
      date: try CoreRepositoryCodec.decodeDate(dateValue ?? fallbackDate),
      tags: tags,
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"]),
      pinned: (row["pinned"] as Int? ?? 0) == 1,
      mood: (row["mood"] as String?).flatMap(JournalMood.init(rawValue:)),
      attachments: attachments,
      userId: row["user_id"]
    )
  }
}

final class GRDBGoalRepository: CoreGoalRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll() throws -> [GoalEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(db, sql: "SELECT * FROM goals ORDER BY created_at DESC;")
      return try rows.map(Self.makeGoal(from:))
    }
  }

  func fetchActive() throws -> [GoalEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(db, sql: "SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC;")
      return try rows.map(Self.makeGoal(from:))
    }
  }

  func fetchByID(_ id: String) throws -> GoalEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM goals WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeGoal(from: row)
    }
  }

  func save(_ goal: GoalEntity) throws {
    let configJSON = try CoreRepositoryCodec.encodeJSON(goal.config)
    let progressJSON = try CoreRepositoryCodec.encodeJSON(goal.progress)
    let remindersJSON = try CoreRepositoryCodec.encodeJSON(goal.reminders)

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO goals (
          id,
          title,
          description,
          type,
          config_json,
          progress_json,
          status,
          priority,
          reminders_json,
          user_id,
          target_value,
          progress_value,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          type = excluded.type,
          config_json = excluded.config_json,
          progress_json = excluded.progress_json,
          status = excluded.status,
          priority = excluded.priority,
          reminders_json = excluded.reminders_json,
          user_id = excluded.user_id,
          target_value = excluded.target_value,
          progress_value = excluded.progress_value,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          goal.id,
          goal.title,
          goal.description,
          goal.type.rawValue,
          configJSON,
          progressJSON,
          goal.status.rawValue,
          goal.priority.rawValue,
          remindersJSON,
          goal.userId,
          goal.progress.target,
          goal.progress.current,
          CoreRepositoryCodec.encodeDate(goal.createdAt),
          CoreRepositoryCodec.encodeDate(goal.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM goals WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeGoal(from row: Row) throws -> GoalEntity {
    let defaultPeriodStart = try CoreRepositoryCodec.decodeDate(row["created_at"])
    let defaultPeriodEnd = try CoreRepositoryCodec.decodeDate(row["updated_at"])

    let defaultConfig = GoalConfig(
      targetCount: row["target_value"],
      projectId: nil,
      priority: nil,
      streakDays: nil,
      targetRate: nil,
      timeframe: .weekly
    )

    let defaultProgress = GoalProgress(
      current: row["progress_value"] ?? 0,
      target: row["target_value"] ?? 1,
      percentage: 0,
      isCompleted: false,
      periodStart: defaultPeriodStart,
      periodEnd: defaultPeriodEnd
    )

    let config: GoalConfig = try CoreRepositoryCodec.decodeJSONOrDefault(GoalConfig.self, from: row["config_json"], default: defaultConfig)
    let progress: GoalProgress = try CoreRepositoryCodec.decodeJSONOrDefault(GoalProgress.self, from: row["progress_json"], default: defaultProgress)
    let reminders: [GoalReminder] = try CoreRepositoryCodec.decodeJSONOrDefault([GoalReminder].self, from: row["reminders_json"], default: [])

    return GoalEntity(
      id: row["id"],
      title: row["title"],
      description: row["description"],
      type: GoalType(rawValue: (row["type"] as String?) ?? GoalType.weeklyTasks.rawValue) ?? .weeklyTasks,
      config: config,
      progress: progress,
      status: GoalStatus(rawValue: (row["status"] as String?) ?? GoalStatus.active.rawValue) ?? .active,
      priority: GoalPriority(rawValue: (row["priority"] as String?) ?? GoalPriority.medium.rawValue) ?? .medium,
      reminders: reminders,
      createdAt: defaultPeriodStart,
      updatedAt: defaultPeriodEnd,
      userId: row["user_id"]
    )
  }
}

struct GRDBCoreRepositorySet {
  let tasks: GRDBTaskRepository
  let projects: GRDBProjectRepository
  let journal: GRDBJournalRepository
  let goals: GRDBGoalRepository

  static func make(databasePath: String) throws -> GRDBCoreRepositorySet {
    var configuration = Configuration()
    configuration.prepareDatabase { db in
      try db.execute(sql: "PRAGMA foreign_keys = ON")
    }

    let dbQueue = try DatabaseQueue(path: databasePath, configuration: configuration)

    return GRDBCoreRepositorySet(
      tasks: GRDBTaskRepository(dbQueue: dbQueue),
      projects: GRDBProjectRepository(dbQueue: dbQueue),
      journal: GRDBJournalRepository(dbQueue: dbQueue),
      goals: GRDBGoalRepository(dbQueue: dbQueue)
    )
  }
}
