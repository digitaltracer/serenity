import Foundation

struct SerenityCloudConfiguration: Equatable, Sendable {
  let baseURL: URL
  let accessToken: String
  var timeout: TimeInterval

  init(baseURL: URL, accessToken: String, timeout: TimeInterval = 15) {
    self.baseURL = baseURL
    self.accessToken = accessToken
    self.timeout = timeout
  }

  static func fromEnvironment(processInfo: ProcessInfo = .processInfo) -> SerenityCloudConfiguration? {
    guard
      let baseURLString = processInfo.environment["SERENITY_CLOUD_BASE_URL"],
      let baseURL = URL(string: baseURLString),
      let accessToken = processInfo.environment["SERENITY_CLOUD_ACCESS_TOKEN"],
      !accessToken.isEmpty
    else {
      return nil
    }

    return SerenityCloudConfiguration(baseURL: baseURL, accessToken: accessToken)
  }
}

struct SerenityCloudDiagnostics: Equatable, Sendable {
  let baseURL: String
  let hasAccessToken: Bool
  let lastHealthyAt: Date?
}

enum SerenityCloudAdapterError: Error, LocalizedError {
  case invalidResponse
  case httpStatus(code: Int, message: String)
  case decodingFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidResponse:
      return "Invalid response from Serenity Cloud."
    case .httpStatus(let code, let message):
      return "Serenity Cloud request failed with status \(code): \(message)"
    case .decodingFailed(let detail):
      return "Failed to decode Serenity Cloud response: \(detail)"
    }
  }
}

final class SerenityCloudAdapter {
  let profile: BackendProfile = .serenityCloud

  private let configuration: SerenityCloudConfiguration
  private let session: URLSession
  private let encoder: JSONEncoder
  private let decoder: JSONDecoder
  private var lastHealthyAt: Date?

  init(
    configuration: SerenityCloudConfiguration,
    session: URLSession = .shared
  ) {
    self.configuration = configuration
    self.session = session

    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    self.encoder = encoder

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    self.decoder = decoder
  }

  func validateConnection() async -> BackendProfileValidationState {
    do {
      _ = try await request(path: "/health", method: "GET", body: Optional<Data>.none, responseType: EmptyResponse.self)
      lastHealthyAt = Date()
      return .available(message: "Connected to Serenity Cloud.")
    } catch {
      return .unavailable(reason: "Serenity Cloud connection failed: \(error.localizedDescription)")
    }
  }

  func diagnostics() -> SerenityCloudDiagnostics {
    SerenityCloudDiagnostics(
      baseURL: configuration.baseURL.absoluteString,
      hasAccessToken: !configuration.accessToken.isEmpty,
      lastHealthyAt: lastHealthyAt
    )
  }

  func listTasks() async throws -> [TaskEntity] {
    let documents = try await request(path: "/tasks", method: "GET", body: Optional<Data>.none, responseType: [CloudTaskDocument].self)
    return documents.map(\.entity)
  }

  func createTask(_ task: TaskEntity) async throws -> TaskEntity {
    let payload = try encoder.encode(CloudTaskDocument(from: task))
    let created = try await request(path: "/tasks", method: "POST", body: payload, responseType: CloudTaskDocument.self)
    return created.entity
  }

  func updateTask(_ task: TaskEntity) async throws -> TaskEntity {
    let payload = try encoder.encode(CloudTaskDocument(from: task))
    let updated = try await request(path: "/tasks/\(task.id)", method: "PATCH", body: payload, responseType: CloudTaskDocument.self)
    return updated.entity
  }

  func deleteTask(id: String) async throws {
    _ = try await request(path: "/tasks/\(id)", method: "DELETE", body: Optional<Data>.none, responseType: EmptyResponse.self)
  }

  func listProjects() async throws -> [ProjectEntity] {
    let documents = try await request(path: "/projects", method: "GET", body: Optional<Data>.none, responseType: [CloudProjectDocument].self)
    return documents.map(\.entity)
  }

  func createProject(_ project: ProjectEntity) async throws -> ProjectEntity {
    let payload = try encoder.encode(CloudProjectDocument(from: project))
    let created = try await request(path: "/projects", method: "POST", body: payload, responseType: CloudProjectDocument.self)
    return created.entity
  }

  func updateProject(_ project: ProjectEntity) async throws -> ProjectEntity {
    let payload = try encoder.encode(CloudProjectDocument(from: project))
    let updated = try await request(path: "/projects/\(project.id)", method: "PATCH", body: payload, responseType: CloudProjectDocument.self)
    return updated.entity
  }

  func deleteProject(id: String) async throws {
    _ = try await request(path: "/projects/\(id)", method: "DELETE", body: Optional<Data>.none, responseType: EmptyResponse.self)
  }

  func listJournalEntries() async throws -> [JournalEntryEntity] {
    let documents = try await request(path: "/journal", method: "GET", body: Optional<Data>.none, responseType: [CloudJournalDocument].self)
    return documents.map(\.entity)
  }

  func createJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity {
    let payload = try encoder.encode(CloudJournalDocument(from: entry))
    let created = try await request(path: "/journal", method: "POST", body: payload, responseType: CloudJournalDocument.self)
    return created.entity
  }

  func updateJournalEntry(_ entry: JournalEntryEntity) async throws -> JournalEntryEntity {
    let payload = try encoder.encode(CloudJournalDocument(from: entry))
    let updated = try await request(path: "/journal/\(entry.id)", method: "PATCH", body: payload, responseType: CloudJournalDocument.self)
    return updated.entity
  }

  func deleteJournalEntry(id: String) async throws {
    _ = try await request(path: "/journal/\(id)", method: "DELETE", body: Optional<Data>.none, responseType: EmptyResponse.self)
  }

  func listGoals() async throws -> [GoalEntity] {
    let documents = try await request(path: "/goals", method: "GET", body: Optional<Data>.none, responseType: [CloudGoalDocument].self)
    return documents.map(\.entity)
  }

  func createGoal(_ goal: GoalEntity) async throws -> GoalEntity {
    let payload = try encoder.encode(CloudGoalDocument(from: goal))
    let created = try await request(path: "/goals", method: "POST", body: payload, responseType: CloudGoalDocument.self)
    return created.entity
  }

  func updateGoal(_ goal: GoalEntity) async throws -> GoalEntity {
    let payload = try encoder.encode(CloudGoalDocument(from: goal))
    let updated = try await request(path: "/goals/\(goal.id)", method: "PATCH", body: payload, responseType: CloudGoalDocument.self)
    return updated.entity
  }

  func deleteGoal(id: String) async throws {
    _ = try await request(path: "/goals/\(id)", method: "DELETE", body: Optional<Data>.none, responseType: EmptyResponse.self)
  }

  private func request<Response: Decodable>(
    path: String,
    method: String,
    body: Data?,
    responseType: Response.Type
  ) async throws -> Response {
    let normalizedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
    var request = URLRequest(url: configuration.baseURL.appendingPathComponent(normalizedPath))
    request.httpMethod = method
    request.timeoutInterval = configuration.timeout
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.addValue("Bearer \(configuration.accessToken)", forHTTPHeaderField: "Authorization")

    if let body {
      request.httpBody = body
    }

    let (data, response) = try await session.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
      throw SerenityCloudAdapterError.invalidResponse
    }

    guard (200 ... 299).contains(httpResponse.statusCode) else {
      let message = String(data: data, encoding: .utf8) ?? "Unknown error"
      throw SerenityCloudAdapterError.httpStatus(code: httpResponse.statusCode, message: message)
    }

    if Response.self == EmptyResponse.self {
      return EmptyResponse() as! Response
    }

    do {
      return try decoder.decode(Response.self, from: data)
    } catch {
      throw SerenityCloudAdapterError.decodingFailed(error.localizedDescription)
    }
  }
}

private struct EmptyResponse: Codable {}

private struct CloudTaskDocument: Codable {
  let id: String
  let title: String
  let description: String?
  let completed: Bool
  let completedAt: Date?
  let priority: TaskPriority
  let dueDate: Date?
  let projectId: String?
  let tags: [String]
  let createdAt: Date
  let updatedAt: Date
  let subtasks: [TaskSubtask]
  let recurring: TaskRecurringPattern?
  let userId: String?

  init(from entity: TaskEntity) {
    id = entity.id
    title = entity.title
    description = entity.description
    completed = entity.completed
    completedAt = entity.completedAt
    priority = entity.priority
    dueDate = entity.dueDate
    projectId = entity.projectId
    tags = entity.tags
    createdAt = entity.createdAt
    updatedAt = entity.updatedAt
    subtasks = entity.subtasks
    recurring = entity.recurring
    userId = entity.userId
  }

  var entity: TaskEntity {
    TaskEntity(
      id: id,
      title: title,
      description: description,
      completed: completed,
      completedAt: completedAt,
      priority: priority,
      dueDate: dueDate,
      projectId: projectId,
      tags: tags,
      createdAt: createdAt,
      updatedAt: updatedAt,
      subtasks: subtasks,
      recurring: recurring,
      userId: userId
    )
  }
}

private struct CloudProjectDocument: Codable {
  let id: String
  let name: String
  let description: String?
  let color: String
  let icon: String?
  let createdAt: Date
  let updatedAt: Date
  let archived: Bool
  let userId: String?

  init(from entity: ProjectEntity) {
    id = entity.id
    name = entity.name
    description = entity.description
    color = entity.color
    icon = entity.icon
    createdAt = entity.createdAt
    updatedAt = entity.updatedAt
    archived = entity.archived
    userId = entity.userId
  }

  var entity: ProjectEntity {
    ProjectEntity(
      id: id,
      name: name,
      description: description,
      color: color,
      icon: icon,
      createdAt: createdAt,
      updatedAt: updatedAt,
      archived: archived,
      userId: userId
    )
  }
}

private struct CloudJournalDocument: Codable {
  let id: String
  let title: String?
  let content: String
  let date: Date
  let tags: [String]
  let createdAt: Date
  let updatedAt: Date
  let pinned: Bool
  let mood: JournalMood?
  let attachments: [JournalAttachmentEntity]
  let userId: String?

  init(from entity: JournalEntryEntity) {
    id = entity.id
    title = entity.title
    content = entity.content
    date = entity.date
    tags = entity.tags
    createdAt = entity.createdAt
    updatedAt = entity.updatedAt
    pinned = entity.pinned
    mood = entity.mood
    attachments = entity.attachments
    userId = entity.userId
  }

  var entity: JournalEntryEntity {
    JournalEntryEntity(
      id: id,
      title: title,
      content: content,
      date: date,
      tags: tags,
      createdAt: createdAt,
      updatedAt: updatedAt,
      pinned: pinned,
      mood: mood,
      attachments: attachments,
      userId: userId
    )
  }
}

private struct CloudGoalDocument: Codable {
  let id: String
  let title: String
  let description: String?
  let type: GoalType
  let config: GoalConfig
  let progress: GoalProgress
  let status: GoalStatus
  let priority: GoalPriority
  let reminders: [GoalReminder]
  let createdAt: Date
  let updatedAt: Date
  let userId: String?

  init(from entity: GoalEntity) {
    id = entity.id
    title = entity.title
    description = entity.description
    type = entity.type
    config = entity.config
    progress = entity.progress
    status = entity.status
    priority = entity.priority
    reminders = entity.reminders
    createdAt = entity.createdAt
    updatedAt = entity.updatedAt
    userId = entity.userId
  }

  var entity: GoalEntity {
    GoalEntity(
      id: id,
      title: title,
      description: description,
      type: type,
      config: config,
      progress: progress,
      status: status,
      priority: priority,
      reminders: reminders,
      createdAt: createdAt,
      updatedAt: updatedAt,
      userId: userId
    )
  }
}
