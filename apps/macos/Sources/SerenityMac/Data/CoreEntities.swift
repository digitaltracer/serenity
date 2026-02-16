import Foundation

public enum TaskPriority: String, Codable, CaseIterable, Sendable {
  case low
  case medium
  case high
}

public struct TaskSubtask: Codable, Equatable, Sendable {
  public var id: String
  public var title: String
  public var completed: Bool
  public var order: Int

  public init(id: String, title: String, completed: Bool, order: Int) {
    self.id = id
    self.title = title
    self.completed = completed
    self.order = order
  }
}

public enum RecurringType: String, Codable, Sendable {
  case daily
  case weekly
  case monthly
  case custom
}

public struct TaskRecurringPattern: Codable, Equatable, Sendable {
  public var type: RecurringType
  public var interval: Int
  public var endDate: Date?

  public init(type: RecurringType, interval: Int, endDate: Date?) {
    self.type = type
    self.interval = interval
    self.endDate = endDate
  }
}

public struct TaskEntity: Identifiable, Equatable, Sendable {
  public var id: String
  public var title: String
  public var description: String?
  public var completed: Bool
  public var completedAt: Date?
  public var priority: TaskPriority
  public var dueDate: Date?
  public var projectId: String?
  public var tags: [String]
  public var createdAt: Date
  public var updatedAt: Date
  public var subtasks: [TaskSubtask]
  public var recurring: TaskRecurringPattern?
  public var userId: String?

  public init(
    id: String,
    title: String,
    description: String?,
    completed: Bool,
    completedAt: Date?,
    priority: TaskPriority,
    dueDate: Date?,
    projectId: String?,
    tags: [String],
    createdAt: Date,
    updatedAt: Date,
    subtasks: [TaskSubtask],
    recurring: TaskRecurringPattern?,
    userId: String?
  ) {
    self.id = id
    self.title = title
    self.description = description
    self.completed = completed
    self.completedAt = completedAt
    self.priority = priority
    self.dueDate = dueDate
    self.projectId = projectId
    self.tags = tags
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.subtasks = subtasks
    self.recurring = recurring
    self.userId = userId
  }
}

public struct ProjectEntity: Identifiable, Equatable, Sendable {
  public var id: String
  public var name: String
  public var description: String?
  public var color: String
  public var icon: String?
  public var createdAt: Date
  public var updatedAt: Date
  public var archived: Bool
  public var userId: String?

  public init(
    id: String,
    name: String,
    description: String?,
    color: String,
    icon: String?,
    createdAt: Date,
    updatedAt: Date,
    archived: Bool,
    userId: String?
  ) {
    self.id = id
    self.name = name
    self.description = description
    self.color = color
    self.icon = icon
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.archived = archived
    self.userId = userId
  }
}

public enum AttachmentType: String, Codable, Sendable {
  case image
  case video
  case audio
  case file
}

public struct JournalAttachmentEntity: Codable, Equatable, Sendable {
  public var id: String
  public var type: AttachmentType
  public var filename: String
  public var originalName: String
  public var path: String
  public var size: Int
  public var mimeType: String
  public var createdAt: Date

  public init(
    id: String,
    type: AttachmentType,
    filename: String,
    originalName: String,
    path: String,
    size: Int,
    mimeType: String,
    createdAt: Date
  ) {
    self.id = id
    self.type = type
    self.filename = filename
    self.originalName = originalName
    self.path = path
    self.size = size
    self.mimeType = mimeType
    self.createdAt = createdAt
  }
}

public enum JournalMood: String, Codable, Sendable {
  case happy
  case neutral
  case sad
  case excited
  case stressed
}

public struct JournalEntryEntity: Identifiable, Equatable, Sendable {
  public var id: String
  public var title: String?
  public var content: String
  public var date: Date
  public var tags: [String]
  public var createdAt: Date
  public var updatedAt: Date
  public var pinned: Bool
  public var mood: JournalMood?
  public var attachments: [JournalAttachmentEntity]
  public var userId: String?

  public init(
    id: String,
    title: String?,
    content: String,
    date: Date,
    tags: [String],
    createdAt: Date,
    updatedAt: Date,
    pinned: Bool,
    mood: JournalMood?,
    attachments: [JournalAttachmentEntity],
    userId: String?
  ) {
    self.id = id
    self.title = title
    self.content = content
    self.date = date
    self.tags = tags
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.pinned = pinned
    self.mood = mood
    self.attachments = attachments
    self.userId = userId
  }
}

public enum GoalType: String, Codable, Sendable {
  case weeklyTasks = "weekly_tasks"
  case projectTasks = "project_tasks"
  case priorityTasks = "priority_tasks"
  case dailyStreak = "daily_streak"
  case journalWeekly = "journal_weekly"
  case completionRate = "completion_rate"
}

public enum GoalTimeframe: String, Codable, Sendable {
  case daily
  case weekly
  case monthly
}

public struct GoalConfig: Codable, Equatable, Sendable {
  public var targetCount: Double?
  public var projectId: String?
  public var priority: TaskPriority?
  public var streakDays: Int?
  public var targetRate: Double?
  public var timeframe: GoalTimeframe

  public init(
    targetCount: Double?,
    projectId: String?,
    priority: TaskPriority?,
    streakDays: Int?,
    targetRate: Double?,
    timeframe: GoalTimeframe
  ) {
    self.targetCount = targetCount
    self.projectId = projectId
    self.priority = priority
    self.streakDays = streakDays
    self.targetRate = targetRate
    self.timeframe = timeframe
  }
}

public struct GoalProgress: Codable, Equatable, Sendable {
  public var current: Double
  public var target: Double
  public var percentage: Double
  public var isCompleted: Bool
  public var periodStart: Date
  public var periodEnd: Date

  public init(
    current: Double,
    target: Double,
    percentage: Double,
    isCompleted: Bool,
    periodStart: Date,
    periodEnd: Date
  ) {
    self.current = current
    self.target = target
    self.percentage = percentage
    self.isCompleted = isCompleted
    self.periodStart = periodStart
    self.periodEnd = periodEnd
  }
}

public enum GoalStatus: String, Codable, Sendable {
  case active
  case completed
  case paused
  case failed
}

public enum GoalPriority: String, Codable, Sendable {
  case low
  case medium
  case high
}

public enum ReminderType: String, Codable, Sendable {
  case goalCheck = "goal_check"
  case taskDue = "task_due"
  case habitReminder = "habit_reminder"
  case custom
}

public enum ReminderStatus: String, Codable, Sendable {
  case pending
  case sent
  case dismissed
  case snoozed
}

public enum ReminderRepeatType: String, Codable, Sendable {
  case daily
  case weekly
  case monthly
  case custom
}

public struct ReminderRepeatPattern: Codable, Equatable, Sendable {
  public var type: ReminderRepeatType
  public var interval: Int
  public var endDate: Date?

  public init(type: ReminderRepeatType, interval: Int, endDate: Date?) {
    self.type = type
    self.interval = interval
    self.endDate = endDate
  }
}

public struct ReminderNotificationSettings: Codable, Equatable, Sendable {
  public var enabled: Bool
  public var sound: Bool
  public var popup: Bool
  public var beforeMinutes: Int

  public init(enabled: Bool, sound: Bool, popup: Bool, beforeMinutes: Int) {
    self.enabled = enabled
    self.sound = sound
    self.popup = popup
    self.beforeMinutes = beforeMinutes
  }
}

public struct GoalReminder: Codable, Equatable, Sendable {
  public var id: String
  public var goalId: String?
  public var taskId: String?
  public var title: String
  public var description: String?
  public var reminderDate: Date
  public var type: ReminderType
  public var status: ReminderStatus
  public var repeatPattern: ReminderRepeatPattern?
  public var notificationSettings: ReminderNotificationSettings
  public var createdAt: Date
  public var updatedAt: Date
  public var userId: String?

  public init(
    id: String,
    goalId: String?,
    taskId: String?,
    title: String,
    description: String?,
    reminderDate: Date,
    type: ReminderType,
    status: ReminderStatus,
    repeatPattern: ReminderRepeatPattern?,
    notificationSettings: ReminderNotificationSettings,
    createdAt: Date,
    updatedAt: Date,
    userId: String?
  ) {
    self.id = id
    self.goalId = goalId
    self.taskId = taskId
    self.title = title
    self.description = description
    self.reminderDate = reminderDate
    self.type = type
    self.status = status
    self.repeatPattern = repeatPattern
    self.notificationSettings = notificationSettings
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.userId = userId
  }
}

public struct GoalEntity: Identifiable, Equatable, Sendable {
  public var id: String
  public var title: String
  public var description: String?
  public var type: GoalType
  public var config: GoalConfig
  public var progress: GoalProgress
  public var status: GoalStatus
  public var priority: GoalPriority
  public var reminders: [GoalReminder]
  public var createdAt: Date
  public var updatedAt: Date
  public var userId: String?

  public init(
    id: String,
    title: String,
    description: String?,
    type: GoalType,
    config: GoalConfig,
    progress: GoalProgress,
    status: GoalStatus,
    priority: GoalPriority,
    reminders: [GoalReminder],
    createdAt: Date,
    updatedAt: Date,
    userId: String?
  ) {
    self.id = id
    self.title = title
    self.description = description
    self.type = type
    self.config = config
    self.progress = progress
    self.status = status
    self.priority = priority
    self.reminders = reminders
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.userId = userId
  }
}
