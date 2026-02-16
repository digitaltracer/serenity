import Foundation
import GRDB

protocol AIInsightRepository {
  func fetchAll(limit: Int) throws -> [AIInsightEntity]
  func fetchFiltered(
    category: AIInsightCategory?,
    type: AIInsightType?,
    dismissed: Bool?,
    limit: Int,
    offset: Int
  ) throws -> [AIInsightEntity]
  func fetchByID(_ id: String) throws -> AIInsightEntity?
  func save(_ insight: AIInsightEntity) throws
  func updateFeedback(
    id: String,
    userRating: Int?,
    dismissed: Bool?,
    markedHelpful: Bool?,
    userNotes: String?
  ) throws
  func delete(id: String) throws
}

protocol AIRecapRepository {
  func fetchAll(limit: Int) throws -> [AIRecapEntity]
  func fetchFiltered(type: AIRecapType?, favorited: Bool?, limit: Int, offset: Int) throws -> [AIRecapEntity]
  func fetchByID(_ id: String) throws -> AIRecapEntity?
  func save(_ recap: AIRecapEntity) throws
  func updateInteraction(id: String, viewed: Bool?, favorited: Bool?, exported: Bool?) throws
  func delete(id: String) throws
}

protocol AIUsageRepository {
  func fetchAll(limit: Int) throws -> [AIUsageEntity]
  func save(_ entry: AIUsageEntity) throws
  func saveMany(_ entries: [AIUsageEntity]) throws
}

protocol SummaryRepository {
  func fetchAll() throws -> [SummaryEntity]
  func fetchByID(_ id: String) throws -> SummaryEntity?
  func fetchByType(_ type: SummaryType) throws -> [SummaryEntity]
  func fetchByDateRange(startDate: Date, endDate: Date) throws -> [SummaryEntity]
  func save(_ summary: SummaryEntity) throws
  func delete(id: String) throws
}

protocol AICredentialRepository {
  func fetchAll(enabledOnly: Bool) throws -> [AICredentialEntity]
  func fetchByProvider(_ provider: AICredentialProvider, enabledOnly: Bool) throws -> [AICredentialEntity]
  func fetchByID(_ id: String) throws -> AICredentialEntity?
  func save(_ credential: AICredentialEntity) throws
  func delete(id: String) throws
  func updatePriorities(_ priorities: [(id: String, priority: Int)]) throws
  func recordSuccess(id: String, tokensUsed: Int, at timestamp: Date) throws
  func recordError(id: String, message: String, at timestamp: Date) throws
}

protocol AISettingsRepository {
  func fetch() throws -> AISettingsEntity?
  func save(_ settings: AISettingsEntity) throws
  func clear() throws
}

final class GRDBAIInsightRepository: AIInsightRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll(limit: Int = 200) throws -> [AIInsightEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT ?;",
        arguments: [limit]
      )
      return try rows.map(Self.makeInsight(from:))
    }
  }

  func fetchFiltered(
    category: AIInsightCategory?,
    type: AIInsightType?,
    dismissed: Bool?,
    limit: Int = 50,
    offset: Int = 0
  ) throws -> [AIInsightEntity] {
    let rows = try fetchAll(limit: 2_000)
      .filter { category == nil || $0.category == category }
      .filter { type == nil || $0.type == type }
      .filter { dismissed == nil || $0.dismissed == dismissed }

    return Array(rows.dropFirst(offset).prefix(limit))
  }

  func fetchByID(_ id: String) throws -> AIInsightEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM ai_insights WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeInsight(from: row)
    }
  }

  func save(_ insight: AIInsightEntity) throws {
    let suggestions = try CoreRepositoryCodec.encodeJSON(insight.actionabilitySuggestions)

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO ai_insights (
          id,
          provider,
          type,
          title,
          description,
          confidence,
          category,
          actionable,
          metadata,
          created_at,
          updated_at,
          user_rating,
          dismissed,
          marked_helpful,
          user_notes,
          visualization_data,
          actionability_suggestions,
          theme_id,
          is_recurring,
          occurrence_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          provider = excluded.provider,
          type = excluded.type,
          title = excluded.title,
          description = excluded.description,
          confidence = excluded.confidence,
          category = excluded.category,
          actionable = excluded.actionable,
          metadata = excluded.metadata,
          updated_at = excluded.updated_at,
          user_rating = excluded.user_rating,
          dismissed = excluded.dismissed,
          marked_helpful = excluded.marked_helpful,
          user_notes = excluded.user_notes,
          visualization_data = excluded.visualization_data,
          actionability_suggestions = excluded.actionability_suggestions,
          theme_id = excluded.theme_id,
          is_recurring = excluded.is_recurring,
          occurrence_number = excluded.occurrence_number;
        """,
        arguments: [
          insight.id,
          insight.provider.rawValue,
          insight.type.rawValue,
          insight.title,
          insight.description,
          insight.confidence,
          insight.category.rawValue,
          insight.actionable ? 1 : 0,
          insight.metadataJSON,
          CoreRepositoryCodec.encodeDate(insight.createdAt),
          CoreRepositoryCodec.encodeDate(insight.updatedAt),
          insight.userRating,
          insight.dismissed ? 1 : 0,
          insight.markedHelpful ? 1 : 0,
          insight.userNotes,
          insight.visualizationDataJSON,
          suggestions,
          insight.themeID,
          insight.isRecurring ? 1 : 0,
          insight.occurrenceNumber,
        ]
      )
    }
  }

  func updateFeedback(
    id: String,
    userRating: Int?,
    dismissed: Bool?,
    markedHelpful: Bool?,
    userNotes: String?
  ) throws {
    try dbQueue.write { db in
      try db.execute(
        sql: """
        UPDATE ai_insights
        SET
          user_rating = COALESCE(?, user_rating),
          dismissed = COALESCE(?, dismissed),
          marked_helpful = COALESCE(?, marked_helpful),
          user_notes = COALESCE(?, user_notes),
          updated_at = ?
        WHERE id = ?;
        """,
        arguments: [
          userRating,
          dismissed.map { $0 ? 1 : 0 },
          markedHelpful.map { $0 ? 1 : 0 },
          userNotes,
          CoreRepositoryCodec.encodeDate(Date()),
          id,
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM ai_insights WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeInsight(from row: Row) throws -> AIInsightEntity {
    let suggestions: [String] = try CoreRepositoryCodec.decodeJSONOrDefault(
      [String].self,
      from: row["actionability_suggestions"],
      default: []
    )

    return AIInsightEntity(
      id: row["id"],
      provider: AIProvider(rawValue: (row["provider"] as String?) ?? AIProvider.local.rawValue) ?? .local,
      type: AIInsightType(rawValue: (row["type"] as String?) ?? AIInsightType.productivity.rawValue) ?? .productivity,
      title: row["title"],
      description: row["description"],
      confidence: row["confidence"] ?? 0.5,
      category: AIInsightCategory(rawValue: (row["category"] as String?) ?? AIInsightCategory.tasks.rawValue) ?? .tasks,
      actionable: (row["actionable"] as Int? ?? 0) == 1,
      metadataJSON: (row["metadata"] as String?) ?? "{}",
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"]),
      userRating: row["user_rating"],
      dismissed: (row["dismissed"] as Int? ?? 0) == 1,
      markedHelpful: (row["marked_helpful"] as Int? ?? 0) == 1,
      userNotes: row["user_notes"],
      visualizationDataJSON: row["visualization_data"],
      actionabilitySuggestions: suggestions,
      themeID: row["theme_id"],
      isRecurring: (row["is_recurring"] as Int? ?? 0) == 1,
      occurrenceNumber: row["occurrence_number"] ?? 1
    )
  }
}

final class GRDBAIRecapRepository: AIRecapRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll(limit: Int = 50) throws -> [AIRecapEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM ai_recaps ORDER BY created_at DESC LIMIT ?;",
        arguments: [limit]
      )
      return try rows.map(Self.makeRecap(from:))
    }
  }

  func fetchFiltered(
    type: AIRecapType?,
    favorited: Bool?,
    limit: Int = 20,
    offset: Int = 0
  ) throws -> [AIRecapEntity] {
    let rows = try fetchAll(limit: 1_000)
      .filter { type == nil || $0.type == type }
      .filter { favorited == nil || $0.favorited == favorited }

    return Array(rows.dropFirst(offset).prefix(limit))
  }

  func fetchByID(_ id: String) throws -> AIRecapEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM ai_recaps WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeRecap(from: row)
    }
  }

  func save(_ recap: AIRecapEntity) throws {
    let highlights = try CoreRepositoryCodec.encodeJSON(recap.highlights)
    let challenges = try CoreRepositoryCodec.encodeJSON(recap.challenges)
    let recommendations = try CoreRepositoryCodec.encodeJSON(recap.recommendations)
    let period = try CoreRepositoryCodec.encodeJSON(recap.period)

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO ai_recaps (
          id,
          provider,
          type,
          title,
          summary,
          highlights,
          challenges,
          recommendations,
          period,
          metadata,
          created_at,
          updated_at,
          viewed,
          favorited,
          exported
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          provider = excluded.provider,
          type = excluded.type,
          title = excluded.title,
          summary = excluded.summary,
          highlights = excluded.highlights,
          challenges = excluded.challenges,
          recommendations = excluded.recommendations,
          period = excluded.period,
          metadata = excluded.metadata,
          updated_at = excluded.updated_at,
          viewed = excluded.viewed,
          favorited = excluded.favorited,
          exported = excluded.exported;
        """,
        arguments: [
          recap.id,
          recap.provider.rawValue,
          recap.type.rawValue,
          recap.title,
          recap.summary,
          highlights,
          challenges,
          recommendations,
          period,
          recap.metadataJSON,
          CoreRepositoryCodec.encodeDate(recap.createdAt),
          CoreRepositoryCodec.encodeDate(recap.updatedAt),
          recap.viewed ? 1 : 0,
          recap.favorited ? 1 : 0,
          recap.exported ? 1 : 0,
        ]
      )
    }
  }

  func updateInteraction(id: String, viewed: Bool?, favorited: Bool?, exported: Bool?) throws {
    try dbQueue.write { db in
      try db.execute(
        sql: """
        UPDATE ai_recaps
        SET
          viewed = COALESCE(?, viewed),
          favorited = COALESCE(?, favorited),
          exported = COALESCE(?, exported),
          updated_at = ?
        WHERE id = ?;
        """,
        arguments: [
          viewed.map { $0 ? 1 : 0 },
          favorited.map { $0 ? 1 : 0 },
          exported.map { $0 ? 1 : 0 },
          CoreRepositoryCodec.encodeDate(Date()),
          id,
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM ai_recaps WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeRecap(from row: Row) throws -> AIRecapEntity {
    let highlights: [String] = try CoreRepositoryCodec.decodeJSONOrDefault([String].self, from: row["highlights"], default: [])
    let challenges: [String] = try CoreRepositoryCodec.decodeJSONOrDefault([String].self, from: row["challenges"], default: [])
    let recommendations: [String] = try CoreRepositoryCodec.decodeJSONOrDefault([String].self, from: row["recommendations"], default: [])
    let period: AIRecapPeriod = try CoreRepositoryCodec.decodeJSON(AIRecapPeriod.self, from: row["period"])

    return AIRecapEntity(
      id: row["id"],
      provider: AIProvider(rawValue: (row["provider"] as String?) ?? AIProvider.local.rawValue) ?? .local,
      type: AIRecapType(rawValue: (row["type"] as String?) ?? AIRecapType.weekly.rawValue) ?? .weekly,
      title: row["title"],
      summary: row["summary"],
      highlights: highlights,
      challenges: challenges,
      recommendations: recommendations,
      period: period,
      metadataJSON: (row["metadata"] as String?) ?? "{}",
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"]),
      viewed: (row["viewed"] as Int? ?? 0) == 1,
      favorited: (row["favorited"] as Int? ?? 0) == 1,
      exported: (row["exported"] as Int? ?? 0) == 1
    )
  }
}

final class GRDBAIUsageRepository: AIUsageRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll(limit: Int = 500) throws -> [AIUsageEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM ai_usage ORDER BY timestamp DESC LIMIT ?;",
        arguments: [limit]
      )
      return try rows.map(Self.makeUsage(from:))
    }
  }

  func save(_ entry: AIUsageEntity) throws {
    try saveMany([entry])
  }

  func saveMany(_ entries: [AIUsageEntity]) throws {
    guard !entries.isEmpty else { return }

    try dbQueue.write { db in
      for entry in entries {
        try db.execute(
          sql: """
          INSERT INTO ai_usage (
            id,
            timestamp,
            provider,
            operation,
            prompt_tokens,
            completion_tokens,
            total_tokens
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            timestamp = excluded.timestamp,
            provider = excluded.provider,
            operation = excluded.operation,
            prompt_tokens = excluded.prompt_tokens,
            completion_tokens = excluded.completion_tokens,
            total_tokens = excluded.total_tokens;
          """,
          arguments: [
            entry.id,
            CoreRepositoryCodec.encodeDate(entry.timestamp),
            entry.provider.rawValue,
            entry.operation.rawValue,
            entry.promptTokens,
            entry.completionTokens,
            entry.totalTokens,
          ]
        )
      }
    }
  }

  private static func makeUsage(from row: Row) throws -> AIUsageEntity {
    AIUsageEntity(
      id: row["id"],
      timestamp: try CoreRepositoryCodec.decodeDate(row["timestamp"]),
      provider: AIUsageProvider(rawValue: (row["provider"] as String?) ?? AIUsageProvider.openai.rawValue) ?? .openai,
      operation: AIUsageOperation(rawValue: (row["operation"] as String?) ?? AIUsageOperation.analyze.rawValue) ?? .analyze,
      promptTokens: row["prompt_tokens"] ?? 0,
      completionTokens: row["completion_tokens"] ?? 0,
      totalTokens: row["total_tokens"] ?? 0
    )
  }
}

final class GRDBSummaryRepository: SummaryRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll() throws -> [SummaryEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(db, sql: "SELECT * FROM summaries ORDER BY generated_at DESC;")
      return try rows.map(Self.makeSummary(from:))
    }
  }

  func fetchByID(_ id: String) throws -> SummaryEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM summaries WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeSummary(from: row)
    }
  }

  func fetchByType(_ type: SummaryType) throws -> [SummaryEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: "SELECT * FROM summaries WHERE summary_type = ? ORDER BY generated_at DESC;",
        arguments: [type.rawValue]
      )
      return try rows.map(Self.makeSummary(from:))
    }
  }

  func fetchByDateRange(startDate: Date, endDate: Date) throws -> [SummaryEntity] {
    try dbQueue.read { db in
      let rows = try Row.fetchAll(
        db,
        sql: """
        SELECT * FROM summaries
        WHERE start_date >= ? AND end_date <= ?
        ORDER BY generated_at DESC;
        """,
        arguments: [
          CoreRepositoryCodec.encodeDate(startDate),
          CoreRepositoryCodec.encodeDate(endDate),
        ]
      )

      return try rows.map(Self.makeSummary(from:))
    }
  }

  func save(_ summary: SummaryEntity) throws {
    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO summaries (
          id,
          title,
          content,
          summary_type,
          start_date,
          end_date,
          generated_at,
          word_count,
          metadata,
          provider,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          summary_type = excluded.summary_type,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          generated_at = excluded.generated_at,
          word_count = excluded.word_count,
          metadata = excluded.metadata,
          provider = excluded.provider,
          prompt_tokens = excluded.prompt_tokens,
          completion_tokens = excluded.completion_tokens,
          total_tokens = excluded.total_tokens,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          summary.id,
          summary.title,
          summary.content,
          summary.summaryType.rawValue,
          CoreRepositoryCodec.encodeDate(summary.startDate),
          CoreRepositoryCodec.encodeDate(summary.endDate),
          CoreRepositoryCodec.encodeDate(summary.generatedAt),
          summary.wordCount,
          summary.metadataJSON,
          summary.provider.rawValue,
          summary.promptTokens,
          summary.completionTokens,
          summary.totalTokens,
          CoreRepositoryCodec.encodeDate(summary.createdAt),
          CoreRepositoryCodec.encodeDate(summary.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM summaries WHERE id = ?;", arguments: [id])
    }
  }

  private static func makeSummary(from row: Row) throws -> SummaryEntity {
    SummaryEntity(
      id: row["id"],
      title: row["title"],
      content: row["content"],
      summaryType: SummaryType(rawValue: (row["summary_type"] as String?) ?? SummaryType.combined.rawValue) ?? .combined,
      startDate: try CoreRepositoryCodec.decodeDate(row["start_date"]),
      endDate: try CoreRepositoryCodec.decodeDate(row["end_date"]),
      generatedAt: try CoreRepositoryCodec.decodeDate(row["generated_at"]),
      wordCount: row["word_count"] ?? 0,
      metadataJSON: (row["metadata"] as String?) ?? "{}",
      provider: AIProvider(rawValue: (row["provider"] as String?) ?? AIProvider.local.rawValue) ?? .local,
      promptTokens: row["prompt_tokens"] ?? 0,
      completionTokens: row["completion_tokens"] ?? 0,
      totalTokens: row["total_tokens"] ?? 0,
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"])
    )
  }
}

final class GRDBAICredentialRepository: AICredentialRepository {
  private let dbQueue: DatabaseQueue

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetchAll(enabledOnly: Bool = false) throws -> [AICredentialEntity] {
    try dbQueue.read { db in
      let rows: [Row]
      if enabledOnly {
        rows = try Row.fetchAll(
          db,
          sql: "SELECT * FROM ai_provider_credentials WHERE enabled = 1 ORDER BY priority ASC;"
        )
      } else {
        rows = try Row.fetchAll(db, sql: "SELECT * FROM ai_provider_credentials ORDER BY priority ASC;")
      }

      return try rows.map(Self.makeCredential(from:))
    }
  }

  func fetchByProvider(_ provider: AICredentialProvider, enabledOnly: Bool = true) throws -> [AICredentialEntity] {
    try dbQueue.read { db in
      let rows: [Row]
      if enabledOnly {
        rows = try Row.fetchAll(
          db,
          sql: "SELECT * FROM ai_provider_credentials WHERE provider = ? AND enabled = 1 ORDER BY priority ASC;",
          arguments: [provider.rawValue]
        )
      } else {
        rows = try Row.fetchAll(
          db,
          sql: "SELECT * FROM ai_provider_credentials WHERE provider = ? ORDER BY priority ASC;",
          arguments: [provider.rawValue]
        )
      }

      return try rows.map(Self.makeCredential(from:))
    }
  }

  func fetchByID(_ id: String) throws -> AICredentialEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(db, sql: "SELECT * FROM ai_provider_credentials WHERE id = ?;", arguments: [id]) else {
        return nil
      }

      return try Self.makeCredential(from: row)
    }
  }

  func save(_ credential: AICredentialEntity) throws {
    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO ai_provider_credentials (
          id,
          provider,
          name,
          api_key_encrypted,
          model_preference,
          enabled,
          priority,
          metadata,
          last_used_at,
          total_requests,
          total_tokens,
          success_count,
          error_count,
          last_error,
          last_error_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          provider = excluded.provider,
          name = excluded.name,
          api_key_encrypted = excluded.api_key_encrypted,
          model_preference = excluded.model_preference,
          enabled = excluded.enabled,
          priority = excluded.priority,
          metadata = excluded.metadata,
          last_used_at = excluded.last_used_at,
          total_requests = excluded.total_requests,
          total_tokens = excluded.total_tokens,
          success_count = excluded.success_count,
          error_count = excluded.error_count,
          last_error = excluded.last_error,
          last_error_at = excluded.last_error_at,
          updated_at = excluded.updated_at;
        """,
        arguments: [
          credential.id,
          credential.provider.rawValue,
          credential.name,
          credential.apiKeyEncrypted,
          credential.modelPreference,
          credential.enabled ? 1 : 0,
          credential.priority,
          credential.metadataJSON,
          credential.lastUsedAt.map(CoreRepositoryCodec.encodeDate),
          credential.totalRequests,
          credential.totalTokens,
          credential.successCount,
          credential.errorCount,
          credential.lastError,
          credential.lastErrorAt.map(CoreRepositoryCodec.encodeDate),
          CoreRepositoryCodec.encodeDate(credential.createdAt),
          CoreRepositoryCodec.encodeDate(credential.updatedAt),
        ]
      )
    }
  }

  func delete(id: String) throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM ai_provider_credentials WHERE id = ?;", arguments: [id])
    }
  }

  func updatePriorities(_ priorities: [(id: String, priority: Int)]) throws {
    guard !priorities.isEmpty else { return }

    let now = CoreRepositoryCodec.encodeDate(Date())

    try dbQueue.write { db in
      for item in priorities {
        try db.execute(
          sql: "UPDATE ai_provider_credentials SET priority = ?, updated_at = ? WHERE id = ?;",
          arguments: [item.priority, now, item.id]
        )
      }
    }
  }

  func recordSuccess(id: String, tokensUsed: Int, at timestamp: Date = Date()) throws {
    let now = CoreRepositoryCodec.encodeDate(timestamp)
    try dbQueue.write { db in
      try db.execute(
        sql: """
        UPDATE ai_provider_credentials
        SET
          last_used_at = ?,
          total_requests = total_requests + 1,
          total_tokens = total_tokens + ?,
          success_count = success_count + 1,
          updated_at = ?
        WHERE id = ?;
        """,
        arguments: [now, tokensUsed, now, id]
      )
    }
  }

  func recordError(id: String, message: String, at timestamp: Date = Date()) throws {
    let now = CoreRepositoryCodec.encodeDate(timestamp)
    try dbQueue.write { db in
      try db.execute(
        sql: """
        UPDATE ai_provider_credentials
        SET
          total_requests = total_requests + 1,
          error_count = error_count + 1,
          last_error = ?,
          last_error_at = ?,
          updated_at = ?
        WHERE id = ?;
        """,
        arguments: [message, now, now, id]
      )
    }
  }

  private static func makeCredential(from row: Row) throws -> AICredentialEntity {
    AICredentialEntity(
      id: row["id"],
      provider: AICredentialProvider(rawValue: (row["provider"] as String?) ?? AICredentialProvider.openai.rawValue) ?? .openai,
      name: row["name"],
      apiKeyEncrypted: row["api_key_encrypted"],
      modelPreference: row["model_preference"],
      enabled: (row["enabled"] as Int? ?? 0) == 1,
      priority: row["priority"] ?? 0,
      metadataJSON: (row["metadata"] as String?) ?? "{}",
      lastUsedAt: try CoreRepositoryCodec.decodeOptionalDate(row["last_used_at"]),
      totalRequests: row["total_requests"] ?? 0,
      totalTokens: row["total_tokens"] ?? 0,
      successCount: row["success_count"] ?? 0,
      errorCount: row["error_count"] ?? 0,
      lastError: row["last_error"],
      lastErrorAt: try CoreRepositoryCodec.decodeOptionalDate(row["last_error_at"]),
      createdAt: try CoreRepositoryCodec.decodeDate(row["created_at"]),
      updatedAt: try CoreRepositoryCodec.decodeDate(row["updated_at"])
    )
  }
}

final class GRDBAISettingsRepository: AISettingsRepository {
  private let dbQueue: DatabaseQueue
  private let settingsKey = "ai_settings"

  init(dbQueue: DatabaseQueue) {
    self.dbQueue = dbQueue
  }

  func fetch() throws -> AISettingsEntity? {
    try dbQueue.read { db in
      guard let row = try Row.fetchOne(
        db,
        sql: "SELECT value FROM secure_settings WHERE key = ? ORDER BY updated_at DESC LIMIT 1;",
        arguments: [settingsKey]
      ) else {
        return nil
      }

      return try CoreRepositoryCodec.decodeJSON(AISettingsEntity.self, from: row["value"])
    }
  }

  func save(_ settings: AISettingsEntity) throws {
    let settingsJSON = try CoreRepositoryCodec.encodeJSON(settings)
    let now = CoreRepositoryCodec.encodeDate(Date())

    try dbQueue.write { db in
      try db.execute(
        sql: """
        INSERT INTO secure_settings (key, value, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at;
        """,
        arguments: [settingsKey, settingsJSON, now, now]
      )
    }
  }

  func clear() throws {
    try dbQueue.write { db in
      try db.execute(sql: "DELETE FROM secure_settings WHERE key = ?;", arguments: [settingsKey])
    }
  }
}

struct GRDBAIRepositorySet {
  let insights: GRDBAIInsightRepository
  let recaps: GRDBAIRecapRepository
  let usage: GRDBAIUsageRepository
  let summaries: GRDBSummaryRepository
  let credentials: GRDBAICredentialRepository
  let settings: GRDBAISettingsRepository

  static func make(databasePath: String) throws -> GRDBAIRepositorySet {
    var configuration = Configuration()
    configuration.prepareDatabase { db in
      try db.execute(sql: "PRAGMA foreign_keys = ON")
    }

    let dbQueue = try DatabaseQueue(path: databasePath, configuration: configuration)

    return GRDBAIRepositorySet(
      insights: GRDBAIInsightRepository(dbQueue: dbQueue),
      recaps: GRDBAIRecapRepository(dbQueue: dbQueue),
      usage: GRDBAIUsageRepository(dbQueue: dbQueue),
      summaries: GRDBSummaryRepository(dbQueue: dbQueue),
      credentials: GRDBAICredentialRepository(dbQueue: dbQueue),
      settings: GRDBAISettingsRepository(dbQueue: dbQueue)
    )
  }
}
