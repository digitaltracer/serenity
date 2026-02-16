import XCTest
@testable import SerenityMac

final class AIWorkflowServiceTests: XCTestCase {
  func testGenerateInsightsFailsWithoutCredentials() async throws {
    let (service, _, _) = try makeService()

    do {
      _ = try await service.generateInsights(tasks: [], journalEntries: [], projects: [], goals: [])
      XCTFail("Expected missing credential error")
    } catch let error as AIWorkflowError {
      XCTAssertEqual(error, .noCredentialConfigured)
    }
  }

  func testCredentialFailoverSkipsMissingKeychainSecret() async throws {
    let (service, backend, secretServiceName) = try makeService()

    let first = try await service.addCredential(
      provider: .openai,
      name: "Primary",
      apiKey: "sk-primary",
      modelPreference: "gpt-4o"
    )
    _ = try await service.addCredential(
      provider: .gemini,
      name: "Secondary",
      apiKey: "gm-secondary",
      modelPreference: "gemini-2.0-flash"
    )

    try backend.delete(service: secretServiceName, key: "ai.credentials.\(first.id).apiKey")

    let task = TaskEntity(
      id: UUID().uuidString,
      title: "Task",
      description: nil,
      completed: true,
      completedAt: Date(),
      priority: .medium,
      dueDate: Date(),
      projectId: nil,
      tags: [],
      createdAt: Date(),
      updatedAt: Date(),
      subtasks: [],
      recurring: nil,
      userId: nil
    )

    let summary = try await service.generateSummary(type: .tasks, tasks: [task], journalEntries: [])
    XCTAssertEqual(summary.provider, .gemini)

    let snapshot = try await service.fetchSnapshot(limit: 20)
    XCTAssertEqual(snapshot.summaries.count, 1)
    XCTAssertEqual(snapshot.usage.count, 1)
    XCTAssertEqual(snapshot.usage.first?.provider, .gemini)
  }

  private func makeService() throws -> (AIWorkflowService, InMemorySecretStorageBackend, String) {
    let baseURL = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
      .appendingPathComponent("serenity-ai-tests-\(UUID().uuidString)", isDirectory: true)
    try FileManager.default.createDirectory(at: baseURL, withIntermediateDirectories: true)
    let databaseURL = baseURL.appendingPathComponent("serenity.sqlite")

    let sqliteAdapter = SQLiteBackendAdapter(databaseURL: databaseURL)
    let backend = InMemorySecretStorageBackend()
    let secretServiceName = "test.ai.workflow"
    let secretStore = KeychainSecretStore(service: secretServiceName, backend: backend)
    let service = AIWorkflowService(sqliteBackendAdapter: sqliteAdapter, secretStore: secretStore)

    return (service, backend, secretServiceName)
  }
}

private final class InMemorySecretStorageBackend: SecretStorageBackend {
  private var values: [String: Data] = [:]

  private func namespacedKey(service: String, key: String) -> String {
    "\(service):\(key)"
  }

  func set(service: String, key: String, data: Data) throws {
    values[namespacedKey(service: service, key: key)] = data
  }

  func get(service: String, key: String) throws -> Data? {
    values[namespacedKey(service: service, key: key)]
  }

  func delete(service: String, key: String) throws {
    values.removeValue(forKey: namespacedKey(service: service, key: key))
  }

  func contains(service: String, key: String) throws -> Bool {
    values[namespacedKey(service: service, key: key)] != nil
  }
}

