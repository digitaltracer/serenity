import Foundation

enum TaskCompletionFilter: String, CaseIterable, Identifiable {
  case all
  case open
  case completed

  var id: String { rawValue }

  var title: String {
    switch self {
    case .all:
      return "All"
    case .open:
      return "Open"
    case .completed:
      return "Completed"
    }
  }
}

enum TaskPriorityFilter: String, CaseIterable, Identifiable {
  case any
  case low
  case medium
  case high

  var id: String { rawValue }

  var title: String {
    switch self {
    case .any:
      return "Any Priority"
    case .low:
      return "Low"
    case .medium:
      return "Medium"
    case .high:
      return "High"
    }
  }

  var matches: TaskPriority? {
    switch self {
    case .any:
      return nil
    case .low:
      return .low
    case .medium:
      return .medium
    case .high:
      return .high
    }
  }
}

struct TaskWorkflowFilter: Equatable {
  var query = ""
  var completion: TaskCompletionFilter = .open
  var priority: TaskPriorityFilter = .any
}

enum GlobalSearchResultType: String, CaseIterable, Identifiable, Codable {
  case task
  case project
  case journal
  case goal

  var id: String { rawValue }

  var title: String {
    switch self {
    case .task:
      return "Task"
    case .project:
      return "Project"
    case .journal:
      return "Journal"
    case .goal:
      return "Goal"
    }
  }
}

struct GlobalSearchResult: Identifiable, Equatable, Codable {
  let type: GlobalSearchResultType
  let entityID: String
  let title: String
  let subtitle: String
  let updatedAt: Date

  var id: String { "\(type.rawValue):\(entityID)" }
}

struct GlobalSearchDocument {
  let type: GlobalSearchResultType
  let entityID: String
  let title: String
  let body: String
  let updatedAt: Date
}

extension GlobalSearchResultType {
  var targetSection: AppSection {
    switch self {
    case .task:
      return .actionHub
    case .project:
      return .projects
    case .journal:
      return .journal
    case .goal:
      return .goals
    }
  }

  var systemImage: String {
    switch self {
    case .task:
      return "checklist"
    case .project:
      return "folder"
    case .journal:
      return "book.closed"
    case .goal:
      return "target"
    }
  }
}

struct TaskExportSubtask: Encodable {
  let id: String
  let title: String
  let completed: Bool
  let order: Int
}

struct TaskExportItem: Encodable {
  let id: String
  let title: String
  let description: String?
  let completed: Bool
  let completedAt: Date?
  let priority: String
  let dueDate: Date?
  let projectId: String?
  let tags: [String]
  let subtasks: [TaskExportSubtask]
  let createdAt: Date
  let updatedAt: Date
}

struct ProjectExportItem: Encodable {
  let id: String
  let name: String
  let description: String?
  let color: String
  let icon: String?
  let archived: Bool
  let createdAt: Date
  let updatedAt: Date
}

struct JournalExportItem: Encodable {
  let id: String
  let title: String?
  let content: String
  let date: Date
  let tags: [String]
  let pinned: Bool
  let mood: String?
  let createdAt: Date
  let updatedAt: Date
}

struct GoalExportItem: Encodable {
  let id: String
  let title: String
  let description: String?
  let type: String
  let status: String
  let priority: String
  let progressCurrent: Double
  let progressTarget: Double
  let progressPercentage: Double
  let progressCompleted: Bool
  let createdAt: Date
  let updatedAt: Date
}

struct CoreDataExportSnapshot: Encodable {
  let exportedAt: Date
  let backend: String
  let tasks: [TaskExportItem]
  let projects: [ProjectExportItem]
  let journalEntries: [JournalExportItem]
  let goals: [GoalExportItem]
}
