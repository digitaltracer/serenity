import Foundation

public enum BackendProfile: String, CaseIterable, Identifiable, Sendable {
  case sqliteLocal
  case serenityCloud
  case externalPostgres

  public var id: String { rawValue }

  var title: String {
    switch self {
    case .sqliteLocal:
      return "SQLite (Local)"
    case .serenityCloud:
      return "Serenity Cloud"
    case .externalPostgres:
      return "External PostgreSQL"
    }
  }
}

struct AppSettings {
  var backendProfile: BackendProfile = .sqliteLocal
  var localLockEnabled = false
}

enum AppThemePreference: String, CaseIterable, Identifiable {
  case system
  case light
  case dark

  var id: String { rawValue }

  var title: String {
    switch self {
    case .system:
      return "System"
    case .light:
      return "Light"
    case .dark:
      return "Dark"
    }
  }
}

enum DatabaseBootstrapState: Equatable {
  case idle
  case bootstrapping
  case ready(path: String, appliedCount: Int)
  case failed(message: String)
}

enum CoreWorkflowState: Equatable {
  case idle
  case loading
  case ready
  case failed(message: String)
}

enum BackendSwitchState: Equatable {
  case idle
  case switching(target: BackendProfile)
  case succeeded(message: String)
  case failed(message: String)
}

enum CloudSyncState: Equatable {
  case idle
  case syncing
  case succeeded(message: String)
  case failed(message: String)
}

struct AppAlert: Identifiable {
  let id = UUID()
  let title: String
  let message: String
}

struct AppToast: Identifiable {
  let id = UUID()
  let message: String
}

enum CoreWorkflowError: Error, LocalizedError {
  case unavailableBackend(String)
  case unsupportedBackend(BackendProfile)

  var errorDescription: String? {
    switch self {
    case .unavailableBackend(let reason):
      return reason
    case .unsupportedBackend(let profile):
      return "\(profile.title) data workflows are not implemented yet."
    }
  }
}

@MainActor
final class AppState: ObservableObject {
  private static let themePreferenceDefaultsKey = "serenity.ui.themePreference"

  @Published var selectedSection: AppSection? = .home
  @Published var settings = AppSettings()
  @Published var themePreference: AppThemePreference = .system
  @Published var backendSelectionState = BackendProfileSelectionState(
    activeProfile: .sqliteLocal,
    descriptors: BackendProfileRegistry.live.orderedDescriptors,
    validations: [:],
    lastValidatedAt: [:]
  )
  @Published var activeAlert: AppAlert?
  @Published var activeToast: AppToast?
  @Published var databaseBootstrapState: DatabaseBootstrapState = .idle
  @Published var backendSwitchState: BackendSwitchState = .idle
  @Published var backendDiagnosticsLines: [String] = []
  @Published var authSessionState: AuthSessionState = .unauthenticated
  @Published var localLockStatus: LocalLockStatus = .disabled
  @Published var biometricAvailability: BiometricAuthAvailability = .unavailable(reason: "Not checked")

  @Published var coreWorkflowState: CoreWorkflowState = .idle
  @Published var tasks: [TaskEntity] = []
  @Published var projects: [ProjectEntity] = []
  @Published var journalEntries: [JournalEntryEntity] = []
  @Published var goals: [GoalEntity] = []
  @Published var taskFilter = TaskWorkflowFilter()
  @Published var selectedTaskIDs: Set<String> = []
  @Published var journalDateRangeEnabled = false
  @Published var journalRangeStartDate: Date = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
  @Published var journalRangeEndDate: Date = Date()
  @Published var includeArchivedProjects = true
  @Published var globalSearchQuery = ""
  @Published var globalSearchResults: [GlobalSearchResult] = []
  @Published var databaseManagementLines: [String] = []
  @Published var databaseIntegrityCheckResult = "Not run"
  @Published var lastDatabaseBackupPath: String?
  @Published var lastDatabaseExportPath: String?
  @Published var googleIntegrationState: GoogleIntegrationState = .disconnected
  @Published var githubIntegrationState: GitHubIntegrationState = .empty
  @Published var integrationSyncInProgress = false
  @Published var integrationDiagnosticsLines: [String] = []
  @Published var googleOAuthAuthorizationURL: String?
  @Published var aiModelCatalog: [AICredentialProvider: [String]] = [:]
  @Published var aiCredentials: [AICredentialEntity] = []
  @Published var aiSettings: AISettingsEntity = .defaultValue
  @Published var aiInsights: [AIInsightEntity] = []
  @Published var aiRecaps: [AIRecapEntity] = []
  @Published var aiSummaries: [SummaryEntity] = []
  @Published var aiUsageEntries: [AIUsageEntity] = []
  @Published var aiStatusMessage = "AI features require a configured provider key."
  @Published var lastSummaryExportPath: String?
  @Published var cloudSyncState: CloudSyncState = .idle
  @Published var cloudSyncPolicy: CloudSyncResolutionPolicy = .deferConflicts
  @Published var cloudSyncConflicts: [CloudSyncConflict] = []
  @Published var cloudSyncDiagnostics: [String] = []

  private let sqliteBackendAdapter: SQLiteBackendAdapter
  private let serenityCloudAdapter: SerenityCloudAdapter?
  private let externalPostgresAdapter: ExternalPostgresAdapter?
  private let backendProfileManager: BackendProfileManager
  private let authSessionManager: AuthSessionManager
  private let localLockManager: LocalLockManager
  private let biometricAuthService: BiometricAuthService
  private let securityAuditService: SecurityAuditService
  private let sensitiveOperationRateGuard: SensitiveOperationRateGuard
  private let googleIntegrationService: GoogleIntegrationService
  private let githubIntegrationService: GitHubIntegrationService
  private let aiWorkflowService: AIWorkflowService
  private let cloudSyncEngine: CloudSyncEngine?

  private var sqliteCoreRepositories: GRDBCoreRepositorySet?
  private var globalSearchDocuments: [GlobalSearchDocument] = []

  init(
    backendProfileManager: BackendProfileManager = BackendProfileManager(),
    sqliteBackendAdapter: SQLiteBackendAdapter = SQLiteBackendAdapter(),
    serenityCloudAdapter: SerenityCloudAdapter? = SerenityCloudConfiguration.fromEnvironment().map {
      SerenityCloudAdapter(configuration: $0)
    },
    externalPostgresAdapter: ExternalPostgresAdapter? = ExternalPostgresConfiguration.fromEnvironment().map {
      ExternalPostgresAdapter(configuration: $0)
    },
    authSessionManager: AuthSessionManager = AuthSessionManager(),
    localLockManager: LocalLockManager = LocalLockManager(),
    biometricAuthService: BiometricAuthService = BiometricAuthService(),
    securityAuditService: SecurityAuditService? = nil,
    sensitiveOperationRateGuard: SensitiveOperationRateGuard = SensitiveOperationRateGuard(),
    googleIntegrationService: GoogleIntegrationService = GoogleIntegrationService(),
    githubIntegrationService: GitHubIntegrationService = GitHubIntegrationService(),
    aiWorkflowService: AIWorkflowService? = nil
  ) {
    self.backendProfileManager = backendProfileManager
    self.sqliteBackendAdapter = sqliteBackendAdapter
    self.serenityCloudAdapter = serenityCloudAdapter
    self.externalPostgresAdapter = externalPostgresAdapter
    self.authSessionManager = authSessionManager
    self.localLockManager = localLockManager
    self.biometricAuthService = biometricAuthService
    self.securityAuditService = securityAuditService ?? SecurityAuditService(sqliteBackendAdapter: sqliteBackendAdapter)
    self.sensitiveOperationRateGuard = sensitiveOperationRateGuard
    self.googleIntegrationService = googleIntegrationService
    self.githubIntegrationService = githubIntegrationService
    self.aiWorkflowService = aiWorkflowService ?? AIWorkflowService(sqliteBackendAdapter: sqliteBackendAdapter)
    self.cloudSyncEngine = serenityCloudAdapter.map { CloudSyncEngine(sqliteBackendAdapter: sqliteBackendAdapter, remoteBackend: $0) }

    if let storedTheme = UserDefaults.standard.string(forKey: Self.themePreferenceDefaultsKey),
       let preference = AppThemePreference(rawValue: storedTheme) {
      themePreference = preference
    }
  }

  var filteredTasks: [TaskEntity] {
    tasks.filter { task in
      switch taskFilter.completion {
      case .all:
        break
      case .open:
        if task.completed { return false }
      case .completed:
        if !task.completed { return false }
      }

      if let priority = taskFilter.priority.matches,
         task.priority != priority {
        return false
      }

      let query = taskFilter.query.trimmingCharacters(in: .whitespacesAndNewlines)
      if query.isEmpty {
        return true
      }

      let haystack = [
        task.title,
        task.description ?? "",
        task.tags.joined(separator: " "),
        task.subtasks.map(\.title).joined(separator: " "),
      ]
        .joined(separator: " ")
        .lowercased()

      return haystack.contains(query.lowercased())
    }
  }

  var todayTasks: [TaskEntity] {
    let today = Calendar.current.startOfDay(for: Date())
    return tasks
      .filter { task in
        guard let dueDate = task.dueDate else { return false }
        return Calendar.current.isDate(dueDate, inSameDayAs: today)
      }
      .sorted { lhs, rhs in
        (lhs.dueDate ?? lhs.createdAt) < (rhs.dueDate ?? rhs.createdAt)
      }
  }

  var overdueTasks: [TaskEntity] {
    let startOfToday = Calendar.current.startOfDay(for: Date())
    return tasks
      .filter { task in
        guard let dueDate = task.dueDate else { return false }
        return !task.completed && dueDate < startOfToday
      }
      .sorted { lhs, rhs in
        (lhs.dueDate ?? lhs.createdAt) < (rhs.dueDate ?? rhs.createdAt)
      }
  }

  var filteredJournalEntries: [JournalEntryEntity] {
    guard journalDateRangeEnabled else {
      return journalEntries
    }

    let interval = DateInterval(start: min(journalRangeStartDate, journalRangeEndDate), end: max(journalRangeStartDate, journalRangeEndDate))
    return journalEntries.filter { interval.contains($0.date) }
  }

  func setSection(_ section: AppSection?) {
    selectedSection = section

    if let section {
      AppLogger.info("Section selected: \(section.rawValue)")
    }
  }

  func setThemePreference(_ preference: AppThemePreference) {
    themePreference = preference
    UserDefaults.standard.set(preference.rawValue, forKey: Self.themePreferenceDefaultsKey)
    AppLogger.info("Theme preference updated: \(preference.rawValue)")
  }

  func showError(title: String, message: String) {
    AppLogger.error("\(title): \(message)")
    activeAlert = AppAlert(title: title, message: message)
  }

  func showToast(_ message: String) {
    AppLogger.info("Toast: \(message)")
    activeToast = AppToast(message: message)

    Task {
      try? await Task.sleep(for: .seconds(3))
      if activeToast?.message == message {
        activeToast = nil
      }
    }
  }

  func loadBackendSelectionState() async {
    let state = await backendProfileManager.currentState()
    backendSelectionState = state
    settings.backendProfile = state.activeProfile
    await refreshBackendDiagnostics()
  }

  func bootstrapAuthSession() async {
    authSessionState = await authSessionManager.bootstrap()
  }

  func logout() async {
    guard await assertRateLimit(for: .signOut, operationName: "Sign out") else { return }

    authSessionState = await authSessionManager.logout()
    await securityAuditService.record(
      eventType: .authentication,
      severity: .info,
      message: "User signed out",
      metadata: ["source": "settings"]
    )
  }

  func bootstrapLocalLockState() async {
    localLockStatus = await localLockManager.bootstrap(isEnabled: settings.localLockEnabled)
    biometricAvailability = biometricAuthService.availability()
  }

  func handleLocalLockToggle(_ enabled: Bool) async {
    guard await assertRateLimit(for: .localLockToggle, operationName: "Local lock toggle") else { return }

    if enabled {
      let password = ProcessInfo.processInfo.environment["SERENITY_LOCAL_LOCK_PASSWORD"] ?? "serenity-local-lock"
      localLockStatus = await localLockManager.setEnabled(true, password: password)
      await securityAuditService.record(
        eventType: .localLock,
        severity: .info,
        message: "Local lock enabled"
      )
      if ProcessInfo.processInfo.environment["SERENITY_LOCAL_LOCK_PASSWORD"] == nil {
        showToast("Local lock enabled with development password. Set SERENITY_LOCAL_LOCK_PASSWORD.")
      } else {
        showToast("Local lock enabled")
      }
    } else {
      localLockStatus = await localLockManager.setEnabled(false, password: nil)
      await securityAuditService.record(
        eventType: .localLock,
        severity: .warning,
        message: "Local lock disabled"
      )
      showToast("Local lock disabled")
    }
  }

  func lockAppNow() async {
    localLockStatus = await localLockManager.lock()
    await securityAuditService.record(
      eventType: .localLock,
      severity: .info,
      message: "App locked manually"
    )
  }

  func unlockAppWithConfiguredPassword() async {
    guard await assertRateLimit(for: .passwordUnlock, operationName: "Password unlock") else { return }

    let password = ProcessInfo.processInfo.environment["SERENITY_LOCAL_LOCK_PASSWORD"] ?? "serenity-local-lock"
    localLockStatus = await localLockManager.unlock(password: password)
    let severity: SecurityAuditSeverity = {
      if case .unlocked = localLockStatus { return .info }
      if case .lockedOut = localLockStatus { return .critical }
      return .warning
    }()

    await securityAuditService.record(
      eventType: .localLock,
      severity: severity,
      message: "Password unlock attempt",
      metadata: ["status": statusMessage(for: localLockStatus)]
    )
  }

  func unlockAppWithBiometrics() async {
    guard await assertRateLimit(for: .biometricUnlock, operationName: "Biometric unlock") else { return }

    biometricAvailability = biometricAuthService.availability()

    guard case .available = biometricAvailability else {
      showToast("Touch ID is unavailable on this Mac")
      return
    }

    let authenticated = await biometricAuthService.authenticate(reason: "Unlock Serenity")
    if authenticated {
      localLockStatus = await localLockManager.unlockWithBiometric()
      showToast("Unlocked with Touch ID")
      await securityAuditService.record(
        eventType: .biometricUnlock,
        severity: .info,
        message: "Unlocked with Touch ID"
      )
    } else {
      showToast("Touch ID authentication failed")
      await securityAuditService.record(
        eventType: .biometricUnlock,
        severity: .warning,
        message: "Touch ID authentication failed"
      )
    }
  }

  func statusMessage(for lockStatus: LocalLockStatus) -> String {
    switch lockStatus {
    case .disabled:
      return "Local lock disabled"
    case .unlocked:
      return "Unlocked"
    case .locked(let attemptsRemaining):
      return "Locked (\(attemptsRemaining) attempts remaining before lockout)"
    case .lockedOut(let until):
      return "Locked out until \(Self.backendDiagnosticsDateFormatter.string(from: until))"
    }
  }

  func handleBackendProfileSelection(_ profile: BackendProfile) async {
    guard profile != backendSelectionState.activeProfile else { return }
    guard await assertRateLimit(for: .backendSwitch, operationName: "Backend switch") else { return }

    backendSwitchState = .switching(target: profile)
    let switchResult = await backendProfileManager.switchProfile(to: profile)
    backendSelectionState = switchResult.state
    settings.backendProfile = switchResult.activeProfile

    if switchResult.switched {
      let message = "Primary backend switched to \(switchResult.activeProfile.title)"
      backendSwitchState = .succeeded(message: message)
      showToast(message)
      AppLogger.info("Backend profile changed to: \(switchResult.activeProfile.rawValue)")
      await securityAuditService.record(
        eventType: .backendSwitch,
        severity: .info,
        message: "Primary backend switched",
        metadata: ["activeProfile": switchResult.activeProfile.rawValue]
      )
    } else {
      let message = switchResult.validationState.message
      backendSwitchState = .failed(message: message)
      showToast("\(profile.title): \(message)")
      AppLogger.error("Backend switch to \(profile.rawValue) failed: \(message)")
      await securityAuditService.record(
        eventType: .backendSwitch,
        severity: .warning,
        message: "Primary backend switch rejected",
        metadata: [
          "requestedProfile": profile.rawValue,
          "reason": message,
        ]
      )
    }

    await refreshBackendDiagnostics()
    await refreshCoreWorkflowData()
    await refreshDatabaseManagement()
  }

  func refreshActiveBackendValidation() async {
    let updatedState = await backendProfileManager.refreshValidation()
    backendSelectionState = updatedState
    await refreshBackendDiagnostics()
  }

  func validationState(for profile: BackendProfile) -> BackendProfileValidationState {
    backendSelectionState.validations[profile] ?? .unknown
  }

  func bootstrapLocalDatabaseIfNeeded() async {
    guard settings.backendProfile == .sqliteLocal else { return }
    guard case .idle = databaseBootstrapState else { return }

    await bootstrapLocalDatabase()
  }

  func bootstrapLocalDatabase() async {
    databaseBootstrapState = .bootstrapping

    do {
      let summary = try await sqliteBackendAdapter.bootstrap()
      sqliteCoreRepositories = try sqliteBackendAdapter.makeCoreRepositories()

      databaseBootstrapState = .ready(
        path: summary.databasePath,
        appliedCount: summary.appliedMigrations.count
      )

      if summary.appliedMigrations.isEmpty {
        showToast("Local database ready")
      } else {
        showToast("Applied \(summary.appliedMigrations.count) migration(s)")
      }

      AppLogger.info(
        "Database bootstrap complete at \(summary.databasePath). Applied: \(summary.appliedMigrations.count), Skipped: \(summary.skippedMigrations.count)"
      )
      await refreshBackendDiagnostics()
      await refreshDatabaseManagement()
    } catch {
      sqliteCoreRepositories = nil
      let message = (error as NSError).localizedDescription
      databaseBootstrapState = .failed(message: message)
      showError(title: "Database bootstrap failed", message: message)
      await refreshBackendDiagnostics()
      await refreshDatabaseManagement()
    }
  }

  func bootstrapIntegrations() async {
    do {
      if let googleSession = try await googleIntegrationService.currentSession() {
        googleIntegrationState.connected = true
        googleIntegrationState.userEmail = googleSession.userEmail
        googleIntegrationState.expiresAt = googleSession.expiresAt
      } else {
        googleIntegrationState = .disconnected
      }
    } catch {
      googleIntegrationState.lastError = error.localizedDescription
    }

    do {
      let tokens = try await githubIntegrationService.listTokens()
      githubIntegrationState.tokens = tokens
    } catch {
      githubIntegrationState.lastError = error.localizedDescription
    }

    do {
      googleOAuthAuthorizationURL = try await googleIntegrationService.authorizationURL().absoluteString
    } catch {
      googleOAuthAuthorizationURL = nil
    }

    await refreshIntegrationDiagnostics()
    await refreshCloudSyncDiagnostics()
  }

  func configureGoogleOAuth(
    clientID: String,
    clientSecret: String,
    redirectURI: String,
    scopesCSV: String
  ) async {
    let scopes = scopesCSV
      .split(separator: ",")
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { !$0.isEmpty }
    let configuration = GoogleOAuthConfiguration(
      clientID: clientID.trimmingCharacters(in: .whitespacesAndNewlines),
      clientSecret: clientSecret.trimmingCharacters(in: .whitespacesAndNewlines),
      redirectURI: redirectURI.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        ? "http://localhost:8080/oauth/callback"
        : redirectURI.trimmingCharacters(in: .whitespacesAndNewlines),
      scopes: scopes.isEmpty ? ["https://www.googleapis.com/auth/calendar.readonly"] : scopes,
      authBaseURL: URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!,
      tokenURL: URL(string: "https://oauth2.googleapis.com/token")!,
      userInfoURL: URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!,
      calendarEventsURL: URL(string: "https://www.googleapis.com/calendar/v3/calendars/primary/events")!
    )
    await googleIntegrationService.updateConfiguration(configuration)
    do {
      googleOAuthAuthorizationURL = try await googleIntegrationService.authorizationURL().absoluteString
      showToast("Google OAuth configuration updated")
    } catch {
      showError(title: "Failed to configure Google OAuth", message: error.localizedDescription)
    }
  }

  func connectGoogleWithAuthorizationCode(_ code: String) async {
    do {
      let session = try await googleIntegrationService.exchangeAuthorizationCode(code)
      googleIntegrationState.connected = true
      googleIntegrationState.userEmail = session.userEmail
      googleIntegrationState.expiresAt = session.expiresAt
      googleIntegrationState.lastError = nil
      showToast("Google connected")
      await refreshIntegrationDiagnostics()
    } catch {
      googleIntegrationState.lastError = error.localizedDescription
      showError(title: "Google OAuth failed", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func connectGoogleWithAccessToken(
    accessToken: String,
    refreshToken: String?,
    userEmail: String?,
    expiresInHours: Int
  ) async {
    let trimmedToken = accessToken.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedToken.isEmpty else {
      showToast("Google access token is required")
      return
    }

    let expiresAt = Calendar.current.date(byAdding: .hour, value: max(1, expiresInHours), to: Date())
    do {
      _ = try await googleIntegrationService.connectWithToken(
        accessToken: trimmedToken,
        refreshToken: refreshToken?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == true ? nil : refreshToken,
        expiresAt: expiresAt,
        userEmail: userEmail?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == true ? nil : userEmail
      )
      googleIntegrationState.connected = true
      googleIntegrationState.userEmail = userEmail
      googleIntegrationState.expiresAt = expiresAt
      googleIntegrationState.lastError = nil
      showToast("Google token connected")
      await refreshIntegrationDiagnostics()
    } catch {
      googleIntegrationState.lastError = error.localizedDescription
      showError(title: "Google token connect failed", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func disconnectGoogleIntegration() async {
    do {
      try await googleIntegrationService.disconnect()
      googleIntegrationState = .disconnected
      showToast("Google disconnected")
    } catch {
      googleIntegrationState.lastError = error.localizedDescription
      showError(title: "Failed to disconnect Google", message: error.localizedDescription)
    }
    await refreshIntegrationDiagnostics()
  }

  func setGoogleIntegrationSyncEnabled(_ enabled: Bool) async {
    googleIntegrationState.syncEnabled = enabled
    await refreshIntegrationDiagnostics()
  }

  func addGitHubIntegrationToken(token: String, displayName: String?) async {
    do {
      let tokens = try await githubIntegrationService.addToken(token, displayName: displayName)
      githubIntegrationState.tokens = tokens
      githubIntegrationState.lastError = nil
      showToast("GitHub token added")
      await refreshIntegrationDiagnostics()
    } catch {
      githubIntegrationState.lastError = error.localizedDescription
      showError(title: "Failed to add GitHub token", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func removeGitHubIntegrationToken(id: String) async {
    do {
      githubIntegrationState.tokens = try await githubIntegrationService.removeToken(id: id)
      showToast("GitHub token removed")
      await refreshIntegrationDiagnostics()
    } catch {
      githubIntegrationState.lastError = error.localizedDescription
      showError(title: "Failed to remove GitHub token", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func toggleGitHubIntegrationToken(id: String) async {
    do {
      githubIntegrationState.tokens = try await githubIntegrationService.toggleTokenActive(id: id)
      await refreshIntegrationDiagnostics()
    } catch {
      githubIntegrationState.lastError = error.localizedDescription
      showError(title: "Failed to update GitHub token", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func setGitHubIntegrationSyncEnabled(_ enabled: Bool) async {
    githubIntegrationState.syncEnabled = enabled
    await refreshIntegrationDiagnostics()
  }

  func syncIntegrationsNow() async {
    integrationSyncInProgress = true
    var outcomes: [IntegrationSyncOutcome] = []

    defer {
      integrationSyncInProgress = false
    }

    do {
      if googleIntegrationState.connected && googleIntegrationState.syncEnabled {
        let payload = try await googleIntegrationService.syncCalendarTasks(
          existingTasks: tasks,
          existingProjects: projects
        )
        if let project = payload.project {
          try await saveProject(project)
        }
        for task in payload.tasks {
          try await saveTask(task)
        }
        googleIntegrationState.lastSyncAt = Date()
        outcomes.append(
          IntegrationSyncOutcome(
            provider: .google,
            importedTasks: payload.importedCount,
            detail: "Imported \(payload.importedCount) Google calendar task(s)"
          )
        )
      }

      if githubIntegrationState.syncEnabled && !githubIntegrationState.tokens.isEmpty {
        let payload = try await githubIntegrationService.syncGitHubPullRequests(
          existingTasks: tasks,
          existingProjects: projects
        )
        if let project = payload.project {
          try await saveProject(project)
        }
        for task in payload.tasks {
          try await saveTask(task)
        }
        githubIntegrationState.tokens = (try? await githubIntegrationService.listTokens()) ?? githubIntegrationState.tokens
        githubIntegrationState.lastSyncAt = Date()
        outcomes.append(
          IntegrationSyncOutcome(
            provider: .github,
            importedTasks: payload.importedCount,
            detail: "Imported \(payload.importedCount) GitHub PR task(s)"
          )
        )
      }

      if outcomes.isEmpty {
        showToast("No integrations were enabled for sync")
      } else {
        let summary = outcomes.map(\.detail).joined(separator: " • ")
        showToast(summary)
      }

      await refreshCoreWorkflowData()
      await refreshIntegrationDiagnostics()
    } catch {
      showError(title: "Integration sync failed", message: error.localizedDescription)
      await refreshIntegrationDiagnostics()
    }
  }

  func refreshIntegrationDiagnostics() async {
    var lines: [String] = []
    lines.append("Google connected: \(googleIntegrationState.connected ? "yes" : "no")")
    lines.append("Google sync enabled: \(googleIntegrationState.syncEnabled ? "yes" : "no")")
    if let userEmail = googleIntegrationState.userEmail {
      lines.append("Google account: \(userEmail)")
    }
    if let lastSyncAt = googleIntegrationState.lastSyncAt {
      lines.append("Google last sync: \(Self.backendDiagnosticsDateFormatter.string(from: lastSyncAt))")
    }
    if let error = googleIntegrationState.lastError {
      lines.append("Google error: \(error)")
    }

    lines.append("GitHub tokens: \(githubIntegrationState.tokens.count)")
    lines.append("GitHub sync enabled: \(githubIntegrationState.syncEnabled ? "yes" : "no")")
    if let lastSyncAt = githubIntegrationState.lastSyncAt {
      lines.append("GitHub last sync: \(Self.backendDiagnosticsDateFormatter.string(from: lastSyncAt))")
    }
    if let error = githubIntegrationState.lastError {
      lines.append("GitHub error: \(error)")
    }

    integrationDiagnosticsLines = lines
  }

  func runCloudSync() async {
    guard let cloudSyncEngine else {
      cloudSyncState = .failed(message: "Cloud sync engine is unavailable.")
      await refreshCloudSyncDiagnostics()
      return
    }

    cloudSyncState = .syncing
    do {
      let result = try await cloudSyncEngine.syncAllEntities(policy: cloudSyncPolicy)
      cloudSyncConflicts = result.conflicts
      cloudSyncState = .succeeded(message: result.summaryLine)
      await refreshCoreWorkflowData()
      await refreshCloudSyncDiagnostics()
      showToast(result.summaryLine)
    } catch {
      cloudSyncState = .failed(message: error.localizedDescription)
      await refreshCloudSyncDiagnostics()
      showError(title: "Cloud sync failed", message: error.localizedDescription)
    }
  }

  func resolveCloudSyncConflict(_ conflict: CloudSyncConflict, policy: CloudSyncResolutionPolicy) async {
    guard let cloudSyncEngine else { return }

    do {
      try await cloudSyncEngine.resolveConflict(conflict, policy: policy)
      cloudSyncConflicts.removeAll { $0.id == conflict.id }
      await refreshCoreWorkflowData()
      await refreshCloudSyncDiagnostics()
      showToast("Resolved conflict for \(conflict.entityID)")
    } catch {
      showError(title: "Conflict resolution failed", message: error.localizedDescription)
    }
  }

  func refreshCloudSyncDiagnostics() async {
    var lines: [String] = []
    lines.append("Policy: \(cloudSyncPolicy.rawValue)")
    lines.append("Pending conflicts: \(cloudSyncConflicts.count)")
    switch cloudSyncState {
    case .idle:
      lines.append("Sync state: idle")
    case .syncing:
      lines.append("Sync state: syncing")
    case .succeeded(let message):
      lines.append("Sync state: succeeded (\(message))")
    case .failed(let message):
      lines.append("Sync state: failed (\(message))")
    }

    cloudSyncDiagnostics = lines
  }

  func bootstrapAIWorkflows() async {
    aiModelCatalog = await aiWorkflowService.modelCatalog()
    await refreshAIWorkflows()
  }

  func refreshAIWorkflows() async {
    do {
      let snapshot = try await aiWorkflowService.fetchSnapshot(limit: 200)
      aiCredentials = snapshot.credentials
      aiSettings = snapshot.settings
      aiInsights = snapshot.insights
      aiRecaps = snapshot.recaps
      aiSummaries = snapshot.summaries
      aiUsageEntries = snapshot.usage

      if aiCredentials.contains(where: { $0.enabled }) {
        aiStatusMessage = "AI is ready."
      } else {
        aiStatusMessage = "AI features require a configured provider key."
      }
    } catch {
      aiStatusMessage = "Failed to load AI state: \(error.localizedDescription)"
    }
  }

  func addAICredential(
    provider: AICredentialProvider,
    name: String,
    apiKey: String,
    modelPreference: String?
  ) async {
    let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedKey.isEmpty else {
      showToast("API key is required")
      return
    }

    do {
      _ = try await aiWorkflowService.addCredential(
        provider: provider,
        name: name,
        apiKey: trimmedKey,
        modelPreference: modelPreference
      )
      showToast("\(provider.rawValue.capitalized) credential added")
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to add credential", message: error.localizedDescription)
      await refreshAIWorkflows()
    }
  }

  func updateAICredentialEnabled(id: String, enabled: Bool) async {
    do {
      _ = try await aiWorkflowService.updateCredential(id: id, enabled: enabled)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update credential", message: error.localizedDescription)
    }
  }

  func updateAICredentialModel(id: String, modelPreference: String?) async {
    do {
      _ = try await aiWorkflowService.updateCredential(id: id, modelPreference: modelPreference)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update credential model", message: error.localizedDescription)
    }
  }

  func deleteAICredential(id: String) async {
    do {
      try await aiWorkflowService.deleteCredential(id: id)
      showToast("Credential deleted")
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to delete credential", message: error.localizedDescription)
    }
  }

  func setAIActiveProvider(_ provider: AICredentialProvider?) async {
    var updated = aiSettings
    updated.activeProvider = provider

    do {
      try await aiWorkflowService.saveSettings(updated)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to save AI settings", message: error.localizedDescription)
    }
  }

  func setAIPreferredModel(provider: AICredentialProvider, model: String?) async {
    var preferred = aiSettings.preferredModels ?? AIPreferredModels(openai: nil, gemini: nil, anthropic: nil)
    switch provider {
    case .openai:
      preferred.openai = model
    case .gemini:
      preferred.gemini = model
    case .anthropic:
      preferred.anthropic = model
    }

    var updated = aiSettings
    updated.preferredModels = preferred

    do {
      try await aiWorkflowService.saveSettings(updated)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update preferred model", message: error.localizedDescription)
    }
  }

  func setAIDataTypes(includeTasks: Bool, includeJournal: Bool, includeProjects: Bool) async {
    var updated = aiSettings
    updated.dataTypes = AISettingsDataTypes(
      includeTasks: includeTasks,
      includeJournal: includeJournal,
      includeProjects: includeProjects
    )

    do {
      try await aiWorkflowService.saveSettings(updated)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to save AI data settings", message: error.localizedDescription)
    }
  }

  func setAIAutoAnalyze(_ enabled: Bool) async {
    var updated = aiSettings
    updated.autoAnalyze = enabled

    do {
      try await aiWorkflowService.saveSettings(updated)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to save auto-analyze setting", message: error.localizedDescription)
    }
  }

  func setAIAnalysisFrequency(_ frequency: AIAnalysisFrequency) async {
    var updated = aiSettings
    updated.analysisFrequency = frequency

    do {
      try await aiWorkflowService.saveSettings(updated)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to save analysis frequency", message: error.localizedDescription)
    }
  }

  func runAIAnalysis() async {
    do {
      _ = try await aiWorkflowService.generateInsights(
        tasks: aiSettings.dataTypes.includeTasks ? tasks : [],
        journalEntries: aiSettings.dataTypes.includeJournal ? journalEntries : [],
        projects: aiSettings.dataTypes.includeProjects ? projects : [],
        goals: goals
      )
      showToast("Insights generated")
      await refreshAIWorkflows()
    } catch {
      aiStatusMessage = error.localizedDescription
      showError(title: "Insight generation failed", message: error.localizedDescription)
      await refreshAIWorkflows()
    }
  }

  func updateAIInsightFeedback(
    id: String,
    userRating: Int?,
    dismissed: Bool?,
    markedHelpful: Bool?,
    userNotes: String?
  ) async {
    do {
      try await aiWorkflowService.updateInsightFeedback(
        id: id,
        userRating: userRating,
        dismissed: dismissed,
        markedHelpful: markedHelpful,
        userNotes: userNotes
      )
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update insight feedback", message: error.localizedDescription)
    }
  }

  func generateAIRecap(type: AIRecapType) async {
    do {
      _ = try await aiWorkflowService.generateRecap(
        type: type,
        tasks: tasks,
        journalEntries: journalEntries,
        projects: projects
      )
      showToast("\(type == .weekly ? "Weekly" : "Monthly") recap generated")
      await refreshAIWorkflows()
    } catch {
      aiStatusMessage = error.localizedDescription
      showError(title: "Recap generation failed", message: error.localizedDescription)
      await refreshAIWorkflows()
    }
  }

  func markRecapViewed(id: String) async {
    do {
      try await aiWorkflowService.updateRecapInteraction(id: id, viewed: true, favorited: nil, exported: nil)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update recap", message: error.localizedDescription)
    }
  }

  func toggleRecapFavorite(id: String) async {
    guard let recap = aiRecaps.first(where: { $0.id == id }) else { return }

    do {
      try await aiWorkflowService.updateRecapInteraction(id: id, viewed: nil, favorited: !recap.favorited, exported: nil)
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to update recap favorite", message: error.localizedDescription)
    }
  }

  func generateAISummary(type: SummaryType) async {
    do {
      _ = try await aiWorkflowService.generateSummary(
        type: type,
        tasks: tasks,
        journalEntries: journalEntries
      )
      showToast("\(type.rawValue.capitalized) summary generated")
      await refreshAIWorkflows()
    } catch {
      aiStatusMessage = error.localizedDescription
      showError(title: "Summary generation failed", message: error.localizedDescription)
      await refreshAIWorkflows()
    }
  }

  func deleteAISummary(id: String) async {
    do {
      try await aiWorkflowService.deleteSummary(id: id)
      showToast("Summary deleted")
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to delete summary", message: error.localizedDescription)
    }
  }

  func exportAISummary(id: String) async {
    do {
      lastSummaryExportPath = try await aiWorkflowService.exportSummary(id: id)
      showToast("Summary exported")
      await refreshAIWorkflows()
    } catch {
      showError(title: "Failed to export summary", message: error.localizedDescription)
    }
  }

  func refreshCoreWorkflowData() async {
    coreWorkflowState = .loading

    do {
      let loadedTasks = try await fetchTasks()
      let loadedProjects = try await fetchProjects()
      let loadedJournalEntries = try await fetchJournalEntries()
      let loadedGoals = try await fetchGoals()

      tasks = loadedTasks.sorted { $0.createdAt > $1.createdAt }
      projects = loadedProjects.sorted { lhs, rhs in
        if lhs.archived != rhs.archived {
          return lhs.archived == false
        }

        return lhs.updatedAt > rhs.updatedAt
      }
      journalEntries = loadedJournalEntries.sorted { $0.date > $1.date }
      goals = loadedGoals.sorted { $0.updatedAt > $1.updatedAt }

      selectedTaskIDs = selectedTaskIDs.filter { id in tasks.contains(where: { $0.id == id }) }
      rebuildGlobalSearchIndex()
      setGlobalSearchQuery(globalSearchQuery)

      coreWorkflowState = .ready
      await refreshDatabaseManagement()
      await refreshIntegrationDiagnostics()
    } catch {
      let message = error.localizedDescription
      coreWorkflowState = .failed(message: message)
      showError(title: "Data load failed", message: message)
    }
  }

  func quickAddTaskFromCommand() async {
    await createTask(
      title: "Quick task \(Self.commandDateFormatter.string(from: Date()))",
      priority: .medium,
      dueDate: Date(),
      tags: ["quick-add"],
      subtaskTitles: []
    )
  }

  func createTask(
    title: String,
    priority: TaskPriority,
    dueDate: Date?,
    tags: [String],
    subtaskTitles: [String]
  ) async {
    let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedTitle.isEmpty else {
      showToast("Task title cannot be empty")
      return
    }

    let now = Date()
    let task = TaskEntity(
      id: UUID().uuidString,
      title: trimmedTitle,
      description: nil,
      completed: false,
      completedAt: nil,
      priority: priority,
      dueDate: dueDate,
      projectId: nil,
      tags: tags.filter { !$0.isEmpty },
      createdAt: now,
      updatedAt: now,
      subtasks: subtaskTitles.enumerated().map { offset, title in
        TaskSubtask(id: UUID().uuidString, title: title, completed: false, order: offset)
      },
      recurring: nil,
      userId: nil
    )

    do {
      try await createTask(task)
      showToast("Task created")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to create task", message: error.localizedDescription)
    }
  }

  func toggleTaskCompletion(id: String) async {
    guard let task = tasks.first(where: { $0.id == id }) else { return }

    var updated = task
    updated.completed.toggle()
    updated.completedAt = updated.completed ? Date() : nil
    updated.updatedAt = Date()

    do {
      try await saveTask(updated)
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update task", message: error.localizedDescription)
    }
  }

  func deleteTask(id: String) async {
    do {
      try await deleteTask(id: id, in: settings.backendProfile)
      selectedTaskIDs.remove(id)
      showToast("Task deleted")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to delete task", message: error.localizedDescription)
    }
  }

  func toggleTaskSelection(id: String) {
    if selectedTaskIDs.contains(id) {
      selectedTaskIDs.remove(id)
    } else {
      selectedTaskIDs.insert(id)
    }
  }

  func clearTaskSelection() {
    selectedTaskIDs.removeAll()
  }

  func markSelectedTasksCompleted() async {
    guard !selectedTaskIDs.isEmpty else { return }

    do {
      for id in selectedTaskIDs {
        guard let task = tasks.first(where: { $0.id == id }) else { continue }
        var updated = task
        updated.completed = true
        updated.completedAt = Date()
        updated.updatedAt = Date()
        try await saveTask(updated)
      }

      showToast("Updated \(selectedTaskIDs.count) tasks")
      selectedTaskIDs.removeAll()
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update tasks", message: error.localizedDescription)
    }
  }

  func deleteSelectedTasks() async {
    guard !selectedTaskIDs.isEmpty else { return }

    do {
      for id in selectedTaskIDs {
        try await deleteTask(id: id, in: settings.backendProfile)
      }

      showToast("Deleted \(selectedTaskIDs.count) tasks")
      selectedTaskIDs.removeAll()
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to delete tasks", message: error.localizedDescription)
    }
  }

  func addSubtask(taskID: String, title: String) async {
    let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    guard let task = tasks.first(where: { $0.id == taskID }) else { return }

    var updated = task
    updated.subtasks.append(
      TaskSubtask(
        id: UUID().uuidString,
        title: trimmed,
        completed: false,
        order: updated.subtasks.count
      )
    )
    updated.updatedAt = Date()

    do {
      try await saveTask(updated)
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to add subtask", message: error.localizedDescription)
    }
  }

  func toggleSubtask(taskID: String, subtaskID: String) async {
    guard let task = tasks.first(where: { $0.id == taskID }) else { return }

    var updated = task
    guard let index = updated.subtasks.firstIndex(where: { $0.id == subtaskID }) else { return }

    updated.subtasks[index].completed.toggle()
    updated.updatedAt = Date()

    do {
      try await saveTask(updated)
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update subtask", message: error.localizedDescription)
    }
  }

  func createProject(name: String, description: String, color: String) async {
    let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedName.isEmpty else {
      showToast("Project name cannot be empty")
      return
    }

    let now = Date()
    let project = ProjectEntity(
      id: UUID().uuidString,
      name: trimmedName,
      description: description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : description,
      color: color,
      icon: nil,
      createdAt: now,
      updatedAt: now,
      archived: false,
      userId: nil
    )

    do {
      try await createProject(project)
      showToast("Project created")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to create project", message: error.localizedDescription)
    }
  }

  func toggleProjectArchive(id: String) async {
    guard let project = projects.first(where: { $0.id == id }) else { return }

    var updated = project
    updated.archived.toggle()
    updated.updatedAt = Date()

    do {
      try await saveProject(updated)
      showToast(updated.archived ? "Project archived" : "Project unarchived")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update project", message: error.localizedDescription)
    }
  }

  func updateProject(
    id: String,
    name: String,
    description: String,
    color: String
  ) async {
    guard let existing = projects.first(where: { $0.id == id }) else { return }
    let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedName.isEmpty else {
      showToast("Project name cannot be empty")
      return
    }

    var updated = existing
    updated.name = trimmedName
    updated.description = description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : description
    updated.color = color
    updated.updatedAt = Date()

    do {
      try await saveProject(updated)
      showToast("Project updated")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update project", message: error.localizedDescription)
    }
  }

  func deleteProject(id: String) async {
    do {
      try await deleteProject(id: id, in: settings.backendProfile)
      showToast("Project deleted")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to delete project", message: error.localizedDescription)
    }
  }

  func createJournalEntry(
    title: String,
    content: String,
    mood: JournalMood?,
    tags: [String]
  ) async {
    let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedContent.isEmpty else {
      showToast("Journal content cannot be empty")
      return
    }

    let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
    let now = Date()
    let entry = JournalEntryEntity(
      id: UUID().uuidString,
      title: trimmedTitle.isEmpty ? nil : trimmedTitle,
      content: trimmedContent,
      date: now,
      tags: tags.filter { !$0.isEmpty },
      createdAt: now,
      updatedAt: now,
      pinned: false,
      mood: mood,
      attachments: [],
      userId: nil
    )

    do {
      try await createJournalEntry(entry)
      showToast("Journal entry created")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to create journal entry", message: error.localizedDescription)
    }
  }

  func toggleJournalPin(id: String) async {
    guard let entry = journalEntries.first(where: { $0.id == id }) else { return }

    var updated = entry
    updated.pinned.toggle()
    updated.updatedAt = Date()

    do {
      try await saveJournalEntry(updated)
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update journal entry", message: error.localizedDescription)
    }
  }

  func updateJournalEntry(
    id: String,
    title: String,
    content: String,
    mood: JournalMood?,
    tags: [String]
  ) async {
    guard let existing = journalEntries.first(where: { $0.id == id }) else { return }
    let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedContent.isEmpty else {
      showToast("Journal content cannot be empty")
      return
    }

    let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
    var updated = existing
    updated.title = trimmedTitle.isEmpty ? nil : trimmedTitle
    updated.content = trimmedContent
    updated.mood = mood
    updated.tags = tags.filter { !$0.isEmpty }
    updated.updatedAt = Date()

    do {
      try await saveJournalEntry(updated)
      showToast("Journal entry updated")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update journal entry", message: error.localizedDescription)
    }
  }

  func deleteJournalEntry(id: String) async {
    do {
      try await deleteJournalEntry(id: id, in: settings.backendProfile)
      showToast("Journal entry deleted")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to delete journal entry", message: error.localizedDescription)
    }
  }

  func createGoal(title: String, target: Double, type: GoalType, priority: GoalPriority) async {
    let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedTitle.isEmpty else {
      showToast("Goal title cannot be empty")
      return
    }

    let normalizedTarget = max(1, target)
    let now = Date()
    let periodStart = Calendar.current.startOfDay(for: now)
    let periodEnd = Calendar.current.date(byAdding: .day, value: 7, to: periodStart) ?? now

    let goal = GoalEntity(
      id: UUID().uuidString,
      title: trimmedTitle,
      description: nil,
      type: type,
      config: GoalConfig(
        targetCount: normalizedTarget,
        projectId: nil,
        priority: nil,
        streakDays: nil,
        targetRate: nil,
        timeframe: .weekly
      ),
      progress: GoalProgress(
        current: 0,
        target: normalizedTarget,
        percentage: 0,
        isCompleted: false,
        periodStart: periodStart,
        periodEnd: periodEnd
      ),
      status: .active,
      priority: priority,
      reminders: [],
      createdAt: now,
      updatedAt: now,
      userId: nil
    )

    do {
      try await createGoal(goal)
      showToast("Goal created")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to create goal", message: error.localizedDescription)
    }
  }

  func incrementGoalProgress(id: String) async {
    guard let goal = goals.first(where: { $0.id == id }) else { return }

    var updated = goal
    let target = max(1, updated.progress.target)
    let current = min(target, updated.progress.current + 1)
    let percentage = min(100, (current / target) * 100)

    updated.progress.current = current
    updated.progress.percentage = percentage
    updated.progress.isCompleted = current >= target
    updated.status = updated.progress.isCompleted ? .completed : .active
    updated.updatedAt = Date()

    do {
      try await saveGoal(updated)
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to update goal", message: error.localizedDescription)
    }
  }

  func deleteGoal(id: String) async {
    do {
      try await deleteGoal(id: id, in: settings.backendProfile)
      showToast("Goal deleted")
      await refreshCoreWorkflowData()
    } catch {
      showError(title: "Failed to delete goal", message: error.localizedDescription)
    }
  }

  func setGlobalSearchQuery(_ query: String) {
    globalSearchQuery = query

    let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      globalSearchResults = []
      return
    }

    let lowercasedTerms = trimmed.lowercased().split(separator: " ").map(String.init)

    let scored = globalSearchDocuments.compactMap { document -> (GlobalSearchResult, Int)? in
      let combined = "\(document.title) \(document.body)".lowercased()
      let matchCount = lowercasedTerms.reduce(into: 0) { count, term in
        if combined.contains(term) {
          count += 1
        }
      }

      guard matchCount == lowercasedTerms.count else {
        return nil
      }

      let score = (document.title.lowercased().contains(trimmed.lowercased()) ? 10 : 0) + matchCount
      let result = GlobalSearchResult(
        type: document.type,
        entityID: document.entityID,
        title: document.title,
        subtitle: document.body,
        updatedAt: document.updatedAt
      )

      return (result, score)
    }

    globalSearchResults = scored
      .sorted { lhs, rhs in
        if lhs.1 == rhs.1 {
          return lhs.0.updatedAt > rhs.0.updatedAt
        }

        return lhs.1 > rhs.1
      }
      .map(\.0)
  }

  func refreshDatabaseManagement() async {
    var lines: [String] = []
    lines.append("Active backend: \(backendSelectionState.activeProfile.title)")
    lines.append("Tasks: \(tasks.count)")
    lines.append("Projects: \(projects.count)")
    lines.append("Journal entries: \(journalEntries.count)")
    lines.append("Goals: \(goals.count)")

    if let backup = lastDatabaseBackupPath {
      lines.append("Last backup: \(backup)")
    }

    if let export = lastDatabaseExportPath {
      lines.append("Last export: \(export)")
    }

    do {
      lines.append("SQLite path: \(try sqliteBackendAdapter.currentDatabasePath())")
      lines.append("Integrity check: \(databaseIntegrityCheckResult)")
    } catch {
      lines.append("SQLite diagnostics unavailable: \(error.localizedDescription)")
    }

    databaseManagementLines = lines
  }

  func runDatabaseIntegrityCheck() async {
    do {
      databaseIntegrityCheckResult = try sqliteBackendAdapter.runQuickIntegrityCheck()
      showToast("Integrity check: \(databaseIntegrityCheckResult)")
    } catch {
      databaseIntegrityCheckResult = "failed"
      showError(title: "Integrity check failed", message: error.localizedDescription)
    }

    await refreshDatabaseManagement()
  }

  func createDatabaseBackup() async {
    do {
      _ = try await requireSQLiteCoreRepositories()
      let summary = try sqliteBackendAdapter.createBackup()
      lastDatabaseBackupPath = summary.backupPath
      showToast("Backup created")
    } catch {
      showError(title: "Backup failed", message: error.localizedDescription)
    }

    await refreshDatabaseManagement()
  }

  func exportCoreDataSnapshot() async {
    let snapshot = CoreDataExportSnapshot(
      exportedAt: Date(),
      backend: settings.backendProfile.rawValue,
      tasks: tasks.map { task in
        TaskExportItem(
          id: task.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          completedAt: task.completedAt,
          priority: task.priority.rawValue,
          dueDate: task.dueDate,
          projectId: task.projectId,
          tags: task.tags,
          subtasks: task.subtasks.map { subtask in
            TaskExportSubtask(
              id: subtask.id,
              title: subtask.title,
              completed: subtask.completed,
              order: subtask.order
            )
          },
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        )
      },
      projects: projects.map { project in
        ProjectExportItem(
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          icon: project.icon,
          archived: project.archived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        )
      },
      journalEntries: journalEntries.map { entry in
        JournalExportItem(
          id: entry.id,
          title: entry.title,
          content: entry.content,
          date: entry.date,
          tags: entry.tags,
          pinned: entry.pinned,
          mood: entry.mood?.rawValue,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        )
      },
      goals: goals.map { goal in
        GoalExportItem(
          id: goal.id,
          title: goal.title,
          description: goal.description,
          type: goal.type.rawValue,
          status: goal.status.rawValue,
          priority: goal.priority.rawValue,
          progressCurrent: goal.progress.current,
          progressTarget: goal.progress.target,
          progressPercentage: goal.progress.percentage,
          progressCompleted: goal.progress.isCompleted,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt
        )
      }
    )

    do {
      let exportsDirectory = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support/Serenity/exports", isDirectory: true)
      try FileManager.default.createDirectory(at: exportsDirectory, withIntermediateDirectories: true)

      let formatter = DateFormatter()
      formatter.locale = Locale(identifier: "en_US_POSIX")
      formatter.timeZone = TimeZone(secondsFromGMT: 0)
      formatter.dateFormat = "yyyyMMdd-HHmmss"

      let filename = "serenity-export-\(formatter.string(from: Date())).json"
      let destination = exportsDirectory.appendingPathComponent(filename)

      let encoder = JSONEncoder()
      encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
      encoder.dateEncodingStrategy = .iso8601

      let data = try encoder.encode(snapshot)
      try data.write(to: destination, options: .atomic)
      lastDatabaseExportPath = destination.path
      showToast("Data export complete")
    } catch {
      showError(title: "Export failed", message: error.localizedDescription)
    }

    await refreshDatabaseManagement()
  }

  func refreshBackendDiagnostics() async {
    var lines: [String] = []
    let active = backendSelectionState.activeProfile

    lines.append("Active profile: \(active.title)")
    lines.append("Validation: \(validationState(for: active).message)")

    if let lastValidated = backendSelectionState.lastValidatedAt[active] {
      lines.append("Last validation: \(Self.backendDiagnosticsDateFormatter.string(from: lastValidated))")
    } else {
      lines.append("Last validation: never")
    }

    do {
      let sqlite = try sqliteBackendAdapter.diagnostics()
      lines.append("SQLite path: \(sqlite.databasePath)")
      lines.append("SQLite bootstrapped: \(sqlite.isBootstrapped ? "yes" : "no")")
    } catch {
      lines.append("SQLite diagnostics error: \(error.localizedDescription)")
    }

    if let serenityCloudAdapter {
      let cloud = serenityCloudAdapter.diagnostics()
      lines.append("Cloud base URL: \(cloud.baseURL)")
      lines.append("Cloud access token configured: \(cloud.hasAccessToken ? "yes" : "no")")
      if let lastHealthyAt = cloud.lastHealthyAt {
        lines.append("Cloud last healthy: \(Self.backendDiagnosticsDateFormatter.string(from: lastHealthyAt))")
      }
    } else {
      lines.append("Cloud adapter: not configured")
    }

    if let externalPostgresAdapter {
      let postgres = externalPostgresAdapter.diagnostics()
      lines.append("PostgreSQL endpoint: \(postgres.host):\(postgres.port) / \(postgres.database)")
      lines.append("PostgreSQL user: \(postgres.username)")
      lines.append("PostgreSQL SSL mode: \(postgres.sslMode)")
      if let lastHealthyAt = postgres.lastHealthyAt {
        lines.append("PostgreSQL last healthy: \(Self.backendDiagnosticsDateFormatter.string(from: lastHealthyAt))")
      }
    } else {
      lines.append("PostgreSQL adapter: not configured")
    }

    backendDiagnosticsLines = lines
  }

  private func rebuildGlobalSearchIndex() {
    var documents: [GlobalSearchDocument] = []

    documents += tasks.map { task in
      GlobalSearchDocument(
        type: .task,
        entityID: task.id,
        title: task.title,
        body: [task.description ?? "", task.tags.joined(separator: " "), task.subtasks.map(\.title).joined(separator: " ")]
          .joined(separator: " "),
        updatedAt: task.updatedAt
      )
    }

    documents += projects.map { project in
      GlobalSearchDocument(
        type: .project,
        entityID: project.id,
        title: project.name,
        body: [project.description ?? "", project.color].joined(separator: " "),
        updatedAt: project.updatedAt
      )
    }

    documents += journalEntries.map { entry in
      GlobalSearchDocument(
        type: .journal,
        entityID: entry.id,
        title: entry.title ?? "Journal Entry",
        body: [entry.content, entry.tags.joined(separator: " ")].joined(separator: " "),
        updatedAt: entry.updatedAt
      )
    }

    documents += goals.map { goal in
      GlobalSearchDocument(
        type: .goal,
        entityID: goal.id,
        title: goal.title,
        body: [goal.description ?? "", goal.type.rawValue, goal.status.rawValue].joined(separator: " "),
        updatedAt: goal.updatedAt
      )
    }

    globalSearchDocuments = documents
  }

  private func requireSQLiteCoreRepositories() async throws -> GRDBCoreRepositorySet {
    if let sqliteCoreRepositories {
      return sqliteCoreRepositories
    }

    let summary = try await sqliteBackendAdapter.bootstrap()
    sqliteCoreRepositories = try sqliteBackendAdapter.makeCoreRepositories()

    if case .ready = databaseBootstrapState {
      // Already reflected by an explicit bootstrap call.
    } else {
      databaseBootstrapState = .ready(path: summary.databasePath, appliedCount: summary.appliedMigrations.count)
    }

    guard let sqliteCoreRepositories else {
      throw CoreWorkflowError.unavailableBackend("Could not initialize SQLite repositories")
    }

    return sqliteCoreRepositories
  }

  private func fetchTasks() async throws -> [TaskEntity] {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      return try repositories.tasks.fetchAll()
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      return try await serenityCloudAdapter.listTasks()
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func createTask(_ task: TaskEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.tasks.save(task)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.createTask(task)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func saveTask(_ task: TaskEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.tasks.save(task)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.updateTask(task)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func deleteTask(id: String, in profile: BackendProfile) async throws {
    switch profile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.tasks.delete(id: id)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      try await serenityCloudAdapter.deleteTask(id: id)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func fetchProjects() async throws -> [ProjectEntity] {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      return try repositories.projects.fetchAll(includeArchived: includeArchivedProjects)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      return try await serenityCloudAdapter.listProjects()
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func createProject(_ project: ProjectEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.projects.save(project)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.createProject(project)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func saveProject(_ project: ProjectEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.projects.save(project)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.updateProject(project)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func deleteProject(id: String, in profile: BackendProfile) async throws {
    switch profile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.projects.delete(id: id)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      try await serenityCloudAdapter.deleteProject(id: id)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func fetchJournalEntries() async throws -> [JournalEntryEntity] {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      if journalDateRangeEnabled {
        let range = DateInterval(start: min(journalRangeStartDate, journalRangeEndDate), end: max(journalRangeStartDate, journalRangeEndDate))
        return try repositories.journal.fetch(in: range)
      }

      return try repositories.journal.fetchAll()
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      return try await serenityCloudAdapter.listJournalEntries()
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func createJournalEntry(_ entry: JournalEntryEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.journal.save(entry)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.createJournalEntry(entry)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func saveJournalEntry(_ entry: JournalEntryEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.journal.save(entry)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.updateJournalEntry(entry)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func deleteJournalEntry(id: String, in profile: BackendProfile) async throws {
    switch profile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.journal.delete(id: id)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      try await serenityCloudAdapter.deleteJournalEntry(id: id)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func fetchGoals() async throws -> [GoalEntity] {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      return try repositories.goals.fetchAll()
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      return try await serenityCloudAdapter.listGoals()
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func createGoal(_ goal: GoalEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.goals.save(goal)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.createGoal(goal)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func saveGoal(_ goal: GoalEntity) async throws {
    switch settings.backendProfile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.goals.save(goal)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      _ = try await serenityCloudAdapter.updateGoal(goal)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private func deleteGoal(id: String, in profile: BackendProfile) async throws {
    switch profile {
    case .sqliteLocal:
      let repositories = try await requireSQLiteCoreRepositories()
      try repositories.goals.delete(id: id)
    case .serenityCloud:
      guard let serenityCloudAdapter else {
        throw CoreWorkflowError.unavailableBackend("Serenity Cloud adapter is not configured")
      }
      try await serenityCloudAdapter.deleteGoal(id: id)
    case .externalPostgres:
      throw CoreWorkflowError.unsupportedBackend(.externalPostgres)
    }
  }

  private static let backendDiagnosticsDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .medium
    return formatter
  }()

  private static let commandDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .none
    formatter.timeStyle = .short
    return formatter
  }()

  private func assertRateLimit(for operation: SensitiveOperation, operationName: String) async -> Bool {
    let decision = await sensitiveOperationRateGuard.evaluate(operation)
    guard decision.allowed else {
      let retrySeconds = Int(decision.retryAfter.rounded(.up))
      let message = "\(operationName) is temporarily rate-limited. Try again in \(retrySeconds)s."
      showToast(message)
      await securityAuditService.record(
        eventType: .securityPolicy,
        severity: .warning,
        message: "Rate guard blocked operation",
        metadata: [
          "operation": operation.rawValue,
          "retryAfterSeconds": "\(retrySeconds)",
        ]
      )
      return false
    }

    return true
  }
}
