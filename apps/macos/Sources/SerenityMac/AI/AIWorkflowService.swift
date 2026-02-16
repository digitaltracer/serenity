import Foundation

enum AIWorkflowError: Error, LocalizedError, Equatable {
  case noCredentialConfigured
  case missingCredentialSecret(String)
  case credentialNotFound(String)
  case summaryNotFound(String)

  var errorDescription: String? {
    switch self {
    case .noCredentialConfigured:
      return "No enabled AI credential is configured. Add a provider key in Insights."
    case .missingCredentialSecret(let id):
      return "Credential \(id) is missing its keychain secret."
    case .credentialNotFound(let id):
      return "Credential \(id) was not found."
    case .summaryNotFound(let id):
      return "Summary \(id) was not found."
    }
  }
}

struct AIProviderModelCatalog {
  static let models: [AICredentialProvider: [String]] = [
    .openai: ["gpt-4.1", "gpt-4o", "gpt-4o-mini"],
    .gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
    .anthropic: ["claude-3-5-sonnet", "claude-3-5-haiku"],
  ]
}

struct AICredentialSelectionResult {
  let credential: AICredentialEntity
  let apiKey: String
  let model: String
}

struct AIWorkflowSnapshot {
  let credentials: [AICredentialEntity]
  let settings: AISettingsEntity
  let insights: [AIInsightEntity]
  let recaps: [AIRecapEntity]
  let summaries: [SummaryEntity]
  let usage: [AIUsageEntity]
}

actor AIWorkflowService {
  private let sqliteBackendAdapter: SQLiteBackendAdapter
  private let secretStore: KeychainSecretStore
  private var repositories: GRDBAIRepositorySet?

  init(
    sqliteBackendAdapter: SQLiteBackendAdapter,
    secretStore: KeychainSecretStore = KeychainSecretStore(service: "com.serenity.macos.ai")
  ) {
    self.sqliteBackendAdapter = sqliteBackendAdapter
    self.secretStore = secretStore
  }

  func modelCatalog() -> [AICredentialProvider: [String]] {
    AIProviderModelCatalog.models
  }

  func fetchSnapshot(limit: Int = 200) async throws -> AIWorkflowSnapshot {
    let repositories = try await requireRepositories()
    let settings = try repositories.settings.fetch() ?? .defaultValue
    return AIWorkflowSnapshot(
      credentials: try repositories.credentials.fetchAll(enabledOnly: false),
      settings: settings,
      insights: try repositories.insights.fetchAll(limit: limit),
      recaps: try repositories.recaps.fetchAll(limit: limit),
      summaries: try repositories.summaries.fetchAll(),
      usage: try repositories.usage.fetchAll(limit: limit)
    )
  }

  func addCredential(
    provider: AICredentialProvider,
    name: String,
    apiKey: String,
    modelPreference: String?
  ) async throws -> AICredentialEntity {
    let repositories = try await requireRepositories()
    let now = Date()
    let id = UUID().uuidString
    let keychainKey = keychainKeyForCredential(id)

    try secretStore.setSecret(apiKey, for: keychainKey)

    let currentCount = try repositories.credentials.fetchAll(enabledOnly: false).count
    let credential = AICredentialEntity(
      id: id,
      provider: provider,
      name: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "\(provider.rawValue.capitalized) Credential" : name,
      apiKeyEncrypted: "keychain://\(keychainKey)",
      modelPreference: modelPreference,
      enabled: true,
      priority: currentCount,
      metadataJSON: "{}",
      lastUsedAt: nil,
      totalRequests: 0,
      totalTokens: 0,
      successCount: 0,
      errorCount: 0,
      lastError: nil,
      lastErrorAt: nil,
      createdAt: now,
      updatedAt: now
    )

    try repositories.credentials.save(credential)
    return credential
  }

  func updateCredential(
    id: String,
    enabled: Bool? = nil,
    name: String? = nil,
    modelPreference: String? = nil,
    priority: Int? = nil
  ) async throws -> AICredentialEntity {
    let repositories = try await requireRepositories()
    guard var credential = try repositories.credentials.fetchByID(id) else {
      throw AIWorkflowError.credentialNotFound(id)
    }

    if let enabled {
      credential.enabled = enabled
    }
    if let name {
      let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
      if !trimmed.isEmpty {
        credential.name = trimmed
      }
    }
    if let modelPreference {
      let trimmed = modelPreference.trimmingCharacters(in: .whitespacesAndNewlines)
      credential.modelPreference = trimmed.isEmpty ? nil : trimmed
    }
    if let priority {
      credential.priority = max(0, priority)
    }
    credential.updatedAt = Date()

    try repositories.credentials.save(credential)
    return credential
  }

  func deleteCredential(id: String) async throws {
    let repositories = try await requireRepositories()
    try repositories.credentials.delete(id: id)
    try secretStore.deleteSecret(for: keychainKeyForCredential(id))
  }

  func saveSettings(_ settings: AISettingsEntity) async throws {
    let repositories = try await requireRepositories()
    try repositories.settings.save(settings)
  }

  func generateInsights(
    tasks: [TaskEntity],
    journalEntries: [JournalEntryEntity],
    projects: [ProjectEntity],
    goals: [GoalEntity]
  ) async throws -> [AIInsightEntity] {
    let repositories = try await requireRepositories()
    let settings = try repositories.settings.fetch() ?? .defaultValue
    let selection = try chooseCredential(settings: settings)
    let now = Date()

    let completedTasks = tasks.filter(\.completed).count
    let totalTasks = max(1, tasks.count)
    let completionRate = Double(completedTasks) / Double(totalTasks)
    let overdueTasks = tasks.filter { !$0.completed && ($0.dueDate ?? now) < now }.count
    let pinnedEntries = journalEntries.filter(\.pinned).count
    let activeGoals = goals.filter { $0.status == .active }.count

    var created: [AIInsightEntity] = []

    created.append(
      AIInsightEntity(
        id: UUID().uuidString,
        provider: providerForCredential(selection.credential.provider),
        type: completionRate >= 0.7 ? .productivity : .warning,
        title: completionRate >= 0.7 ? "Strong completion trend" : "Completion trend needs attention",
        description: "You completed \(completedTasks) of \(tasks.count) tasks (\(Int(completionRate * 100))%).",
        confidence: 0.72,
        category: .tasks,
        actionable: true,
        metadataJSON: #"{"metric":"completion_rate"}"#,
        createdAt: now,
        updatedAt: now,
        userRating: nil,
        dismissed: false,
        markedHelpful: false,
        userNotes: nil,
        visualizationDataJSON: nil,
        actionabilitySuggestions: completionRate >= 0.7
          ? ["Keep your daily planning cadence"]
          : ["Reduce scope on daily task list", "Prioritize high-impact tasks first"],
        themeID: "tasks-completion",
        isRecurring: true,
        occurrenceNumber: 1
      )
    )

    created.append(
      AIInsightEntity(
        id: UUID().uuidString,
        provider: providerForCredential(selection.credential.provider),
        type: overdueTasks > 0 ? .warning : .behavior,
        title: overdueTasks > 0 ? "Overdue tasks detected" : "Due-date hygiene is healthy",
        description: overdueTasks > 0
          ? "You currently have \(overdueTasks) overdue task(s)."
          : "You currently have no overdue tasks.",
        confidence: 0.69,
        category: .tasks,
        actionable: overdueTasks > 0,
        metadataJSON: #"{"metric":"overdue_tasks"}"#,
        createdAt: now,
        updatedAt: now,
        userRating: nil,
        dismissed: false,
        markedHelpful: false,
        userNotes: nil,
        visualizationDataJSON: nil,
        actionabilitySuggestions: overdueTasks > 0
          ? ["Schedule a recovery block for overdue items"]
          : ["Maintain current due-date management approach"],
        themeID: "tasks-overdue",
        isRecurring: true,
        occurrenceNumber: 1
      )
    )

    created.append(
      AIInsightEntity(
        id: UUID().uuidString,
        provider: providerForCredential(selection.credential.provider),
        type: .recommendation,
        title: "Cross-surface focus recommendation",
        description: "You have \(activeGoals) active goal(s), \(projects.count) project(s), and \(pinnedEntries) pinned journal entr\(pinnedEntries == 1 ? "y" : "ies").",
        confidence: 0.64,
        category: .goals,
        actionable: true,
        metadataJSON: #"{"metric":"cross_surface_focus"}"#,
        createdAt: now,
        updatedAt: now,
        userRating: nil,
        dismissed: false,
        markedHelpful: false,
        userNotes: nil,
        visualizationDataJSON: nil,
        actionabilitySuggestions: [
          "Link at least one task to each active goal",
          "Write a short daily journal checkpoint for your top project",
        ],
        themeID: "cross-surface",
        isRecurring: false,
        occurrenceNumber: 1
      )
    )

    for insight in created {
      try repositories.insights.save(insight)
    }

    try recordUsage(
      repositories: repositories,
      selection: selection,
      operation: .analyze,
      promptTokens: 180,
      completionTokens: 120
    )

    return created
  }

  func updateInsightFeedback(
    id: String,
    userRating: Int?,
    dismissed: Bool?,
    markedHelpful: Bool?,
    userNotes: String?
  ) async throws {
    let repositories = try await requireRepositories()
    try repositories.insights.updateFeedback(
      id: id,
      userRating: userRating,
      dismissed: dismissed,
      markedHelpful: markedHelpful,
      userNotes: userNotes
    )
  }

  func generateRecap(
    type: AIRecapType,
    tasks: [TaskEntity],
    journalEntries: [JournalEntryEntity],
    projects: [ProjectEntity]
  ) async throws -> AIRecapEntity {
    let repositories = try await requireRepositories()
    let settings = try repositories.settings.fetch() ?? .defaultValue
    let selection = try chooseCredential(settings: settings)
    let now = Date()

    let days = type == .weekly ? 7 : 30
    let periodStart = Calendar.current.date(byAdding: .day, value: -days, to: now) ?? now
    let completedTasks = tasks.filter(\.completed).count

    let recap = AIRecapEntity(
      id: UUID().uuidString,
      provider: providerForCredential(selection.credential.provider),
      type: type,
      title: "\(type == .weekly ? "Weekly" : "Monthly") recap",
      summary: "Completed \(completedTasks) task(s), captured \(journalEntries.count) journal entr\(journalEntries.count == 1 ? "y" : "ies"), and tracked \(projects.count) project(s).",
      highlights: [
        "Task completion this period: \(completedTasks)",
        "Journal consistency: \(journalEntries.count) entries",
      ],
      challenges: tasks.filter { !$0.completed }.isEmpty ? ["No major blockers detected"] : ["\(tasks.filter { !$0.completed }.count) incomplete task(s) remain"],
      recommendations: [
        "Schedule focused work blocks for top-priority tasks",
        "Review project backlog at the start of each week",
      ],
      period: AIRecapPeriod(start: periodStart, end: now),
      metadataJSON: #"{"generated":"deterministic"}"#,
      createdAt: now,
      updatedAt: now,
      viewed: false,
      favorited: false,
      exported: false
    )

    try repositories.recaps.save(recap)
    try recordUsage(
      repositories: repositories,
      selection: selection,
      operation: .recap,
      promptTokens: 120,
      completionTokens: 140
    )

    return recap
  }

  func updateRecapInteraction(id: String, viewed: Bool?, favorited: Bool?, exported: Bool?) async throws {
    let repositories = try await requireRepositories()
    try repositories.recaps.updateInteraction(id: id, viewed: viewed, favorited: favorited, exported: exported)
  }

  func generateSummary(
    type: SummaryType,
    tasks: [TaskEntity],
    journalEntries: [JournalEntryEntity]
  ) async throws -> SummaryEntity {
    let repositories = try await requireRepositories()
    let settings = try repositories.settings.fetch() ?? .defaultValue
    let selection = try chooseCredential(settings: settings)
    let now = Date()
    let periodStart = Calendar.current.date(byAdding: .day, value: -7, to: now) ?? now

    let taskLines = tasks.prefix(8).map { task in
      "- [\((task.completed ? "x" : " "))] \(task.title)"
    }

    let journalLines = journalEntries.prefix(4).map { entry in
      "- \(entry.title ?? "Entry"): \(entry.content.prefix(120))"
    }

    let content: String
    switch type {
    case .tasks:
      content = (["Task Summary", ""] + taskLines).joined(separator: "\n")
    case .journal:
      content = (["Journal Summary", ""] + journalLines).joined(separator: "\n")
    case .combined:
      content = (["Combined Summary", "", "Tasks:"] + taskLines + ["", "Journal:"] + journalLines).joined(separator: "\n")
    }

    let summary = SummaryEntity(
      id: UUID().uuidString,
      title: "\(type.rawValue.capitalized) Summary",
      content: content,
      summaryType: type,
      startDate: periodStart,
      endDate: now,
      generatedAt: now,
      wordCount: content.split(separator: " ").count,
      metadataJSON: #"{"generated":"deterministic"}"#,
      provider: providerForCredential(selection.credential.provider),
      promptTokens: 90,
      completionTokens: 160,
      totalTokens: 250,
      createdAt: now,
      updatedAt: now
    )

    try repositories.summaries.save(summary)
    try recordUsage(
      repositories: repositories,
      selection: selection,
      operation: .summary,
      promptTokens: summary.promptTokens,
      completionTokens: summary.completionTokens
    )

    return summary
  }

  func deleteSummary(id: String) async throws {
    let repositories = try await requireRepositories()
    try repositories.summaries.delete(id: id)
  }

  func exportSummary(id: String) async throws -> String {
    let repositories = try await requireRepositories()
    guard let summary = try repositories.summaries.fetchByID(id) else {
      throw AIWorkflowError.summaryNotFound(id)
    }

    let exportsDirectory = FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Application Support/Serenity/exports", isDirectory: true)
    try FileManager.default.createDirectory(at: exportsDirectory, withIntermediateDirectories: true)

    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyyMMdd-HHmmss"

    let filename = "summary-\(summary.id)-\(formatter.string(from: Date())).md"
    let fileURL = exportsDirectory.appendingPathComponent(filename)
    let markdown = "# \(summary.title)\n\n\(summary.content)\n"
    try markdown.data(using: .utf8)?.write(to: fileURL, options: .atomic)
    return fileURL.path
  }

  private func chooseCredential(settings: AISettingsEntity) throws -> AICredentialSelectionResult {
    let repositories = try requireRepositoriesSync()
    let enabledCredentials = try repositories.credentials.fetchAll(enabledOnly: true)
      .sorted { lhs, rhs in
        if lhs.priority == rhs.priority {
          return lhs.createdAt < rhs.createdAt
        }
        return lhs.priority < rhs.priority
      }

    var ordered = enabledCredentials
    if let preferred = settings.activeProvider {
      ordered.sort { lhs, rhs in
        if lhs.provider == preferred && rhs.provider != preferred { return true }
        if lhs.provider != preferred && rhs.provider == preferred { return false }
        return lhs.priority < rhs.priority
      }
    }

    for credential in ordered {
      let keychainKey = keychainKeyForCredential(credential.id)
      if let secret = try secretStore.secret(for: keychainKey), !secret.isEmpty {
        let model = credential.modelPreference ?? preferredModel(for: credential.provider, settings: settings)
        return AICredentialSelectionResult(credential: credential, apiKey: secret, model: model)
      }

      try repositories.credentials.recordError(id: credential.id, message: "Missing keychain secret", at: Date())
    }

    throw AIWorkflowError.noCredentialConfigured
  }

  private func preferredModel(for provider: AICredentialProvider, settings: AISettingsEntity) -> String {
    switch provider {
    case .openai:
      return settings.preferredModels?.openai ?? AIProviderModelCatalog.models[.openai]?.first ?? "gpt-4o-mini"
    case .gemini:
      return settings.preferredModels?.gemini ?? AIProviderModelCatalog.models[.gemini]?.first ?? "gemini-2.0-flash"
    case .anthropic:
      return settings.preferredModels?.anthropic ?? AIProviderModelCatalog.models[.anthropic]?.first ?? "claude-3-5-sonnet"
    }
  }

  private func recordUsage(
    repositories: GRDBAIRepositorySet,
    selection: AICredentialSelectionResult,
    operation: AIUsageOperation,
    promptTokens: Int,
    completionTokens: Int
  ) throws {
    let total = promptTokens + completionTokens
    let usage = AIUsageEntity(
      id: UUID().uuidString,
      timestamp: Date(),
      provider: usageProviderForCredential(selection.credential.provider),
      operation: operation,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: total
    )
    try repositories.usage.save(usage)
    try repositories.credentials.recordSuccess(id: selection.credential.id, tokensUsed: total, at: Date())
  }

  private func providerForCredential(_ provider: AICredentialProvider) -> AIProvider {
    switch provider {
    case .openai:
      return .openai
    case .gemini:
      return .gemini
    case .anthropic:
      return .anthropic
    }
  }

  private func usageProviderForCredential(_ provider: AICredentialProvider) -> AIUsageProvider {
    switch provider {
    case .openai:
      return .openai
    case .gemini:
      return .gemini
    case .anthropic:
      return .anthropic
    }
  }

  private func keychainKeyForCredential(_ id: String) -> String {
    "ai.credentials.\(id).apiKey"
  }

  private func requireRepositories() async throws -> GRDBAIRepositorySet {
    if let repositories {
      return repositories
    }

    _ = try await sqliteBackendAdapter.bootstrap()
    let created = try sqliteBackendAdapter.makeAIRepositories()
    repositories = created
    return created
  }

  private func requireRepositoriesSync() throws -> GRDBAIRepositorySet {
    if let repositories {
      return repositories
    }

    throw AIWorkflowError.noCredentialConfigured
  }
}
