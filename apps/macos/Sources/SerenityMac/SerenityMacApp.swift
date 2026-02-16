import SwiftUI

@main
struct SerenityMacApp: App {
  @StateObject private var appState = AppState()

  var body: some Scene {
    WindowGroup {
      NavigationSplitView {
        SerenitySidebar(selectedSection: Binding(
          get: { appState.selectedSection },
          set: { appState.setSection($0) }
        ))
        .navigationSplitViewColumnWidth(min: 236, ideal: 252, max: 282)
      } detail: {
        ZStack {
          SerenityDetailBackground()

          VStack(spacing: 0) {
            SerenityTopBar()

            NavigationStack {
              if let selectedSection = appState.selectedSection {
                SectionView(section: selectedSection)
                  .environmentObject(appState)
              } else {
                ContentUnavailableView("Select a section", systemImage: "sidebar.left")
              }
            }
          }
        }
      }
      .frame(minWidth: 1160, minHeight: 700)
      .navigationSplitViewStyle(.balanced)
      .groupBoxStyle(SerenityPanelGroupBoxStyle())
      .tint(SerenityPalette.accent)
      .preferredColorScheme(.dark)
      .overlay(alignment: .top) {
        if let toast = appState.activeToast {
          ToastBanner(message: toast.message)
            .padding(.top, 12)
        }
      }
      .alert(item: $appState.activeAlert) { alert in
        Alert(title: Text(alert.title), message: Text(alert.message), dismissButton: .default(Text("OK")))
      }
      .onAppear {
        AppLogger.info("Native macOS shell loaded")
        Task {
          await appState.bootstrapAuthSession()
          await appState.bootstrapLocalLockState()
          await appState.loadBackendSelectionState()
          await appState.refreshActiveBackendValidation()
          await appState.bootstrapLocalDatabaseIfNeeded()
          await appState.refreshCoreWorkflowData()
          await appState.bootstrapIntegrations()
          await appState.bootstrapAIWorkflows()
          await appState.refreshDatabaseManagement()
        }
      }
    }
    .commands {
      CommandGroup(after: .newItem) {
        Button("Quick Add Task") {
          Task {
            await appState.quickAddTaskFromCommand()
          }
        }
        .keyboardShortcut("n", modifiers: [.command, .shift])
      }
    }
  }
}

private enum SerenityPalette {
  static let accent = Color(red: 0.27, green: 0.52, blue: 0.95)
  static let windowBackground = Color(red: 0.02, green: 0.07, blue: 0.18)
  static let sidebarBackground = Color(red: 0.03, green: 0.07, blue: 0.16)
  static let sidebarHeaderBackground = Color(red: 0.03, green: 0.08, blue: 0.18)
  static let panelBackground = Color(red: 0.04, green: 0.09, blue: 0.20)
  static let panelBackgroundRaised = Color(red: 0.07, green: 0.13, blue: 0.25)
  static let innerCardBackground = Color(red: 0.08, green: 0.14, blue: 0.25)
  static let border = Color(red: 0.24, green: 0.34, blue: 0.50).opacity(0.55)
  static let thinBorder = Color(red: 0.24, green: 0.34, blue: 0.50).opacity(0.32)
  static let activeItemBackground = Color(red: 0.17, green: 0.25, blue: 0.38)
  static let headerIconBackground = Color(red: 0.10, green: 0.17, blue: 0.30)
  static let textSecondary = Color(red: 0.57, green: 0.65, blue: 0.78)
}

private struct SerenityDetailBackground: View {
  var body: some View {
    ZStack {
      LinearGradient(
        colors: [
          SerenityPalette.windowBackground,
          Color(red: 0.01, green: 0.05, blue: 0.15),
        ],
        startPoint: .top,
        endPoint: .bottom
      )
      .ignoresSafeArea()

      Circle()
        .fill(SerenityPalette.accent.opacity(0.07))
        .frame(width: 520, height: 520)
        .blur(radius: 80)
        .offset(x: 220, y: -250)

      Circle()
        .fill(Color(red: 0.45, green: 0.33, blue: 0.92).opacity(0.09))
        .frame(width: 560, height: 560)
        .blur(radius: 100)
        .offset(x: 0, y: 260)
    }
    .allowsHitTesting(false)
  }
}

private struct SerenityPanelGroupBoxStyle: GroupBoxStyle {
  func makeBody(configuration: Configuration) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      configuration.label
        .font(.system(size: 15, weight: .semibold))
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity, alignment: .leading)

      Divider()
        .overlay(SerenityPalette.thinBorder)

      configuration.content
        .padding(16)
    }
    .background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(SerenityPalette.border, lineWidth: 1)
    )
  }
}

private struct SerenityTopBar: View {
  var body: some View {
    HStack(spacing: 10) {
      Spacer()

      topIcon("magnifyingglass")
      topIcon("questionmark.circle")
      topIcon("display")
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 9)
    .background(SerenityPalette.sidebarHeaderBackground.opacity(0.7))
    .overlay(alignment: .bottom) {
      Rectangle()
        .fill(SerenityPalette.thinBorder)
        .frame(height: 1)
    }
  }

  private func topIcon(_ symbol: String) -> some View {
    Image(systemName: symbol)
      .font(.system(size: 13, weight: .semibold))
      .foregroundStyle(SerenityPalette.textSecondary)
      .frame(width: 30, height: 30)
      .background(.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
  }
}

private struct SerenitySidebar: View {
  @Binding var selectedSection: AppSection?

  private let primarySections: [AppSection] = [.home, .actionHub, .today, .journal, .goals, .projects, .insights]
  private let systemSections: [AppSection] = [.integrations, .database, .settings]

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      sidebarHeader

      VStack(alignment: .leading, spacing: 0) {
        Text("NAVIGATION")
          .font(.system(size: 11, weight: .semibold))
          .tracking(1.1)
          .foregroundStyle(SerenityPalette.textSecondary)
          .padding(.horizontal, 18)
          .padding(.top, 16)

        ScrollView {
          VStack(alignment: .leading, spacing: 4) {
            ForEach(primarySections) { section in
              navRow(section)
            }
          }
          .padding(.horizontal, 14)
          .padding(.top, 10)
        }

        Spacer(minLength: 0)

        Divider()
          .overlay(SerenityPalette.thinBorder)
          .padding(.top, 8)

        VStack(alignment: .leading, spacing: 4) {
          ForEach(systemSections) { section in
            navRow(section)
          }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
      }
    }
    .background(SerenityPalette.sidebarBackground)
    .overlay(alignment: .trailing) {
      Rectangle()
        .fill(SerenityPalette.border)
        .frame(width: 1)
    }
  }

  private var sidebarHeader: some View {
    HStack(spacing: 10) {
      ZStack {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .fill(SerenityPalette.headerIconBackground)
          .frame(width: 36, height: 36)
        Image(systemName: "feather.fill")
          .font(.system(size: 15, weight: .bold))
          .foregroundStyle(SerenityPalette.accent)
      }

      VStack(alignment: .leading, spacing: 1) {
        Text("Serenity Notes")
          .font(.system(size: 17, weight: .semibold))
      }
      Spacer()
    }
    .padding(.horizontal, 18)
    .padding(.vertical, 14)
    .background(SerenityPalette.sidebarHeaderBackground)
    .overlay(alignment: .bottom) {
      Rectangle()
        .fill(SerenityPalette.thinBorder)
        .frame(height: 1)
    }
  }

  private func navRow(_ section: AppSection) -> some View {
    Button {
      selectedSection = section
    } label: {
      HStack(spacing: 10) {
        Image(systemName: section.systemImage)
          .frame(width: 18)
          .font(.system(size: 14, weight: .semibold))

        Text(section.title)
          .font(.system(size: 16, weight: .medium))

        Spacer()
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 10)
      .foregroundStyle(isSelected(section) ? Color.white : SerenityPalette.textSecondary)
      .background(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .fill(isSelected(section) ? SerenityPalette.activeItemBackground : .clear)
      )
    }
    .buttonStyle(.plain)
  }

  private func isSelected(_ section: AppSection) -> Bool {
    selectedSection == section
  }
}

private extension AppSection {
  var subtitle: String {
    switch self {
    case .home:
      return "Boost productivity and mindfulness from one workspace"
    case .actionHub:
      return "Task and project control center"
    case .today:
      return "Deadlines, priorities, and daily momentum"
    case .journal:
      return "Capture notes, mood, and reflections"
    case .goals:
      return "Track progress against measurable targets"
    case .projects:
      return "Organize work across active initiatives"
    case .integrations:
      return "Manage external providers and sync health"
    case .insights:
      return "AI analysis, recaps, and usage intelligence"
    case .database:
      return "Bootstrap, integrity checks, and export tooling"
    case .settings:
      return "Security, auth, backend, and environment controls"
    }
  }
}

private struct SectionView: View {
  @EnvironmentObject private var appState: AppState
  let section: AppSection

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 18) {
        if section != .home {
          sectionHeader
        }

        switch section {
        case .home:
          HomeSectionView()
        case .actionHub:
          ActionHubSectionView()
        case .today:
          TodaySectionView()
        case .journal:
          JournalSectionView()
        case .goals:
          GoalsSectionView()
        case .projects:
          ProjectsSectionView()
        case .integrations:
          IntegrationsSectionView()
        case .insights:
          InsightsSectionView()
        case .database:
          DatabaseSectionView()
        case .settings:
          SettingsSectionView()
        }
      }
      .frame(maxWidth: 1180, alignment: .topLeading)
      .padding(28)
      .padding(.bottom, 16)
    }
    .animation(.easeInOut(duration: 0.2), value: section)
    .onAppear {
      AppLogger.info("Rendered section: \(section.rawValue)")
      if section == .insights {
        Task {
          await appState.refreshAIWorkflows()
        }
      }

      if [.home, .actionHub, .today, .journal, .goals, .projects, .integrations, .database].contains(section) {
        Task {
          await appState.refreshCoreWorkflowData()
        }
      }
    }
  }

  private var sectionHeader: some View {
    HStack(spacing: 12) {
      ZStack {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .fill(SerenityPalette.headerIconBackground)
          .frame(width: 50, height: 50)
        Image(systemName: section.systemImage)
          .font(.system(size: 21, weight: .semibold))
          .foregroundStyle(SerenityPalette.accent)
      }

      VStack(alignment: .leading, spacing: 2) {
        Text(section.title)
          .font(.system(size: 34, weight: .bold))
        Text(section.subtitle)
          .font(.system(size: 22, weight: .regular))
          .foregroundStyle(SerenityPalette.textSecondary)
      }

      Spacer()
    }
    .padding(.vertical, 4)
  }
}

private struct HomeSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var quickCapture = ""
  @State private var submitting = false

  private let columns = [GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16)]

  var body: some View {
    VStack(alignment: .leading, spacing: 18) {
      hero
      quickCaptureCard
      featureGrid
    }
  }

  private var hero: some View {
    VStack(spacing: 12) {
      ZStack {
        Circle()
          .fill(Color.white.opacity(0.92))
          .frame(width: 84, height: 84)
          .shadow(color: SerenityPalette.accent.opacity(0.35), radius: 22)
        Text("S")
          .font(.system(size: 36, weight: .semibold))
          .foregroundStyle(Color.black.opacity(0.85))
      }

      Text("Serenity Notes")
        .font(.system(size: 52, weight: .bold))
      Text("Boost your productivity and mindfulness with an integrated task and journaling workspace.")
        .font(.system(size: 21, weight: .regular))
        .foregroundStyle(SerenityPalette.textSecondary)
        .multilineTextAlignment(.center)
        .frame(maxWidth: 780)
    }
    .frame(maxWidth: .infinity)
    .padding(.top, 8)
    .padding(.bottom, 4)
  }

  private var quickCaptureCard: some View {
    VStack(spacing: 0) {
      ZStack(alignment: .topLeading) {
        RoundedRectangle(cornerRadius: 0)
          .fill(
            LinearGradient(
              colors: [
                SerenityPalette.panelBackgroundRaised.opacity(0.9),
                Color(red: 0.24, green: 0.17, blue: 0.44).opacity(0.55),
              ],
              startPoint: .leading,
              endPoint: .trailing
            )
          )

        TextEditor(text: $quickCapture)
          .font(.system(size: 22, weight: .regular))
          .scrollContentBackground(.hidden)
          .foregroundStyle(.white.opacity(0.95))
          .padding(20)
          .frame(height: 172)
      }

      HStack(spacing: 12) {
        Text("Write naturally. Prefix with `journal:` to create an entry; otherwise we create a task.")
          .font(.system(size: 18, weight: .regular))
          .foregroundStyle(SerenityPalette.textSecondary)

        Spacer()

        Text("Provider: native")
          .font(.system(size: 15, weight: .medium))
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .background(SerenityPalette.innerCardBackground, in: Capsule())
          .overlay(Capsule().stroke(SerenityPalette.thinBorder, lineWidth: 1))

        Button(submitting ? "Submitting..." : "Submit") {
          Task {
            await submitQuickCapture()
          }
        }
        .disabled(submitting || quickCapture.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .buttonStyle(.borderedProminent)
      }
      .padding(.horizontal, 18)
      .padding(.vertical, 14)
      .background(SerenityPalette.panelBackgroundRaised.opacity(0.86))
    }
    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .stroke(SerenityPalette.border, lineWidth: 1)
    )
    .shadow(color: SerenityPalette.accent.opacity(0.2), radius: 20)
  }

  private var featureGrid: some View {
    LazyVGrid(columns: columns, spacing: 16) {
      featureCard(title: "ActionHub", subtitle: "Efficiently manage tasks, projects, and priorities.", icon: "checklist", section: .actionHub)
      featureCard(title: "Journal", subtitle: "Capture thoughts, ideas, and reflections securely.", icon: "book", section: .journal)
      featureCard(title: "Projects", subtitle: "Organize related work with clear progress tracking.", icon: "folder", section: .projects)
      featureCard(title: "Insights Hub", subtitle: "AI-powered insights, analytics, and recommendations.", icon: "brain", section: .insights)
      featureCard(title: "Integrations", subtitle: "Connect external services and monitor sync.", icon: "link", section: .integrations)
      featureCard(title: "Database", subtitle: "Manage backups, integrity checks, and exports.", icon: "internaldrive", section: .database)
    }
  }

  private func featureCard(title: String, subtitle: String, icon: String, section: AppSection) -> some View {
    Button {
      appState.setSection(section)
    } label: {
      VStack(alignment: .leading, spacing: 12) {
        ZStack {
          RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(SerenityPalette.headerIconBackground)
            .frame(width: 54, height: 54)
          Image(systemName: icon)
            .font(.system(size: 24, weight: .semibold))
            .foregroundStyle(SerenityPalette.accent)
        }
        Text(title)
          .font(.system(size: 32, weight: .bold))
          .multilineTextAlignment(.leading)
        Text(subtitle)
          .font(.system(size: 21, weight: .regular))
          .foregroundStyle(SerenityPalette.textSecondary)
          .multilineTextAlignment(.leading)
      }
      .padding(24)
      .frame(maxWidth: .infinity, minHeight: 188, alignment: .topLeading)
      .background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 16, style: .continuous)
          .stroke(SerenityPalette.border, lineWidth: 1)
      )
    }
    .buttonStyle(.plain)
  }

  private func submitQuickCapture() async {
    let text = quickCapture.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty else { return }

    submitting = true
    defer { submitting = false }

    if text.lowercased().hasPrefix("journal:") {
      let content = text.replacingOccurrences(of: "journal:", with: "", options: [.caseInsensitive])
        .trimmingCharacters(in: .whitespacesAndNewlines)
      await appState.createJournalEntry(
        title: "",
        content: content.isEmpty ? text : content,
        mood: nil,
        tags: []
      )
    } else {
      await appState.createTask(
        title: text,
        priority: .medium,
        dueDate: nil,
        tags: [],
        subtaskTitles: []
      )
    }

    quickCapture = ""
    await appState.refreshCoreWorkflowData()
  }
}

struct IntegrationsSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var googleClientID = ProcessInfo.processInfo.environment["SERENITY_GOOGLE_CLIENT_ID"] ?? ""
  @State private var googleClientSecret = ProcessInfo.processInfo.environment["SERENITY_GOOGLE_CLIENT_SECRET"] ?? ""
  @State private var googleRedirectURI = ProcessInfo.processInfo.environment["SERENITY_GOOGLE_REDIRECT_URI"] ?? "http://localhost:8080/oauth/callback"
  @State private var googleScopes = ProcessInfo.processInfo.environment["SERENITY_GOOGLE_SCOPES"] ?? "https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/userinfo.email"
  @State private var googleAuthorizationCode = ""
  @State private var googleAccessToken = ""
  @State private var googleRefreshToken = ""
  @State private var googleUserEmail = ""
  @State private var googleTokenTTLHours = "1"

  @State private var githubToken = ""
  @State private var githubDisplayName = ""

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("Sync Status") {
        VStack(alignment: .leading, spacing: 12) {
          HStack {
            HStack(spacing: 10) {
              ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                  .fill(SerenityPalette.headerIconBackground)
                  .frame(width: 40, height: 40)
                Image(systemName: "arrow.triangle.2.circlepath")
                  .font(.system(size: 17, weight: .semibold))
                  .foregroundStyle(SerenityPalette.textSecondary)
              }

              VStack(alignment: .leading, spacing: 2) {
                Text("All integrations ready for synchronization")
                  .font(.system(size: 21, weight: .semibold))
                Text(appState.integrationSyncInProgress ? "Syncing now..." : "Manual sync available")
                  .font(.system(size: 16, weight: .regular))
                  .foregroundStyle(SerenityPalette.textSecondary)
              }
            }

            Spacer()

            Button("Sync Now") {
              Task {
                await appState.syncIntegrationsNow()
              }
            }
            .buttonStyle(.borderedProminent)
            .disabled(appState.integrationSyncInProgress)
          }

          HStack(spacing: 10) {
            statusBadge(title: "Google", active: appState.googleIntegrationState.connected)
            statusBadge(title: "GitHub", active: !appState.githubIntegrationState.tokens.isEmpty)
            statusBadge(title: "Diagnostics", active: !appState.integrationDiagnosticsLines.isEmpty)
          }
        }
      }

      GroupBox("Connected Providers") {
        VStack(alignment: .leading, spacing: 12) {
          providerSummaryRow(
            title: "Google Calendar",
            detail: appState.googleIntegrationState.connected
              ? "Connected as \(appState.googleIntegrationState.userEmail ?? "unknown")"
              : "Not connected",
            active: appState.googleIntegrationState.connected
          )
          providerSummaryRow(
            title: "GitHub",
            detail: appState.githubIntegrationState.tokens.isEmpty
              ? "No tokens configured"
              : "\(appState.githubIntegrationState.tokens.count) active token(s)",
            active: !appState.githubIntegrationState.tokens.isEmpty
          )
        }
      }

      GroupBox("Google Calendar") {
        VStack(alignment: .leading, spacing: 10) {
          HStack {
            Circle()
              .fill(appState.googleIntegrationState.connected ? Color.green : Color.secondary)
              .frame(width: 10, height: 10)
            Text(appState.googleIntegrationState.connected ? "Connected" : "Disconnected")
            if let user = appState.googleIntegrationState.userEmail {
              Text("(\(user))")
                .foregroundStyle(.secondary)
            }
            Spacer()
            Toggle("Sync Enabled", isOn: Binding(
              get: { appState.googleIntegrationState.syncEnabled },
              set: { enabled in
                Task {
                  await appState.setGoogleIntegrationSyncEnabled(enabled)
                }
              }
            ))
            .toggleStyle(.switch)
            .frame(maxWidth: 170)
          }

          Divider()

          TextField("Google OAuth Client ID", text: $googleClientID)
          SecureField("Google OAuth Client Secret", text: $googleClientSecret)
          TextField("Redirect URI", text: $googleRedirectURI)
          TextField("Scopes (comma-separated)", text: $googleScopes)
          Button("Update OAuth Configuration") {
            Task {
              await appState.configureGoogleOAuth(
                clientID: googleClientID,
                clientSecret: googleClientSecret,
                redirectURI: googleRedirectURI,
                scopesCSV: googleScopes
              )
            }
          }

          if let authorizationURL = appState.googleOAuthAuthorizationURL {
            Text("Authorization URL")
              .font(.caption)
              .foregroundStyle(.secondary)
            Text(authorizationURL)
              .font(.caption)
              .textSelection(.enabled)
          } else {
            Text("Authorization URL unavailable. Configure OAuth credentials.")
              .font(.caption)
              .foregroundStyle(.secondary)
          }

          TextField("Authorization code", text: $googleAuthorizationCode)
          Button("Exchange Authorization Code") {
            Task {
              await appState.connectGoogleWithAuthorizationCode(googleAuthorizationCode)
              googleAuthorizationCode = ""
            }
          }

          Divider()

          Text("Connect with existing token (development/testing)")
            .font(.caption)
            .foregroundStyle(.secondary)
          SecureField("Access token", text: $googleAccessToken)
          SecureField("Refresh token (optional)", text: $googleRefreshToken)
          TextField("User email (optional)", text: $googleUserEmail)
          TextField("Token TTL (hours)", text: $googleTokenTTLHours)
            .frame(maxWidth: 180)

          HStack {
            Button("Connect Token") {
              let ttl = Int(googleTokenTTLHours) ?? 1
              Task {
                await appState.connectGoogleWithAccessToken(
                  accessToken: googleAccessToken,
                  refreshToken: googleRefreshToken,
                  userEmail: googleUserEmail,
                  expiresInHours: ttl
                )
              }
            }
            .buttonStyle(.borderedProminent)

            Button("Disconnect", role: .destructive) {
              Task {
                await appState.disconnectGoogleIntegration()
              }
            }
            .disabled(!appState.googleIntegrationState.connected)
          }
        }
        .padding(.top, 8)
      }

      GroupBox("GitHub") {
        VStack(alignment: .leading, spacing: 10) {
          HStack {
            Circle()
              .fill(appState.githubIntegrationState.tokens.isEmpty ? Color.secondary : Color.green)
              .frame(width: 10, height: 10)
            Text(appState.githubIntegrationState.tokens.isEmpty ? "No tokens configured" : "\(appState.githubIntegrationState.tokens.count) token(s) configured")
            Spacer()
            Toggle("Sync Enabled", isOn: Binding(
              get: { appState.githubIntegrationState.syncEnabled },
              set: { enabled in
                Task {
                  await appState.setGitHubIntegrationSyncEnabled(enabled)
                }
              }
            ))
            .toggleStyle(.switch)
            .frame(maxWidth: 170)
          }

          SecureField("GitHub token", text: $githubToken)
          TextField("Display name (optional)", text: $githubDisplayName)

          Button("Add GitHub Token") {
            Task {
              await appState.addGitHubIntegrationToken(
                token: githubToken,
                displayName: githubDisplayName.isEmpty ? nil : githubDisplayName
              )
              githubToken = ""
              githubDisplayName = ""
            }
          }

          if !appState.githubIntegrationState.tokens.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
              ForEach(appState.githubIntegrationState.tokens) { token in
                HStack {
                  VStack(alignment: .leading, spacing: 2) {
                    Text(token.displayName)
                    Text("@\(token.username) • \(token.maskedToken)")
                      .font(.caption)
                      .foregroundStyle(.secondary)
                  }

                  Spacer()

                  Toggle("Active", isOn: Binding(
                    get: { token.isActive },
                    set: { _ in
                      Task {
                        await appState.toggleGitHubIntegrationToken(id: token.id)
                      }
                    }
                  ))
                  .toggleStyle(.switch)
                  .labelsHidden()

                  Button("Remove", role: .destructive) {
                    Task {
                      await appState.removeGitHubIntegrationToken(id: token.id)
                    }
                  }
                  .buttonStyle(.borderless)
                }
                .padding(8)
                .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
              }
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Sync Controls and Diagnostics") {
        VStack(alignment: .leading, spacing: 10) {
          HStack {
            Button("Refresh Diagnostics") {
              Task {
                await appState.refreshIntegrationDiagnostics()
              }
            }
          }

          if appState.integrationDiagnosticsLines.isEmpty {
            Text("No integration diagnostics available.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.integrationDiagnosticsLines, id: \.self) { line in
              Text(line)
                .font(.caption)
                .textSelection(.enabled)
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Cloud Sync Hardening") {
        VStack(alignment: .leading, spacing: 10) {
          Picker("Conflict policy", selection: Binding(
            get: { appState.cloudSyncPolicy },
            set: { policy in
              appState.cloudSyncPolicy = policy
              Task {
                await appState.refreshCloudSyncDiagnostics()
              }
            }
          )) {
            ForEach([CloudSyncResolutionPolicy.deferConflicts, .preferNewest, .preferLocal, .preferRemote], id: \.rawValue) { policy in
              Text(policy.rawValue).tag(policy)
            }
          }
          .frame(maxWidth: 240)

          HStack {
            Button("Run Full Entity Sync") {
              Task {
                await appState.runCloudSync()
              }
            }
            .buttonStyle(.borderedProminent)

            switch appState.cloudSyncState {
            case .idle:
              EmptyView()
            case .syncing:
              Label("Syncing...", systemImage: "arrow.triangle.2.circlepath")
                .font(.caption)
            case .succeeded(let message):
              Text(message)
                .font(.caption)
                .foregroundStyle(.green)
            case .failed(let message):
              Text(message)
                .font(.caption)
                .foregroundStyle(.red)
            }
          }

          if appState.cloudSyncConflicts.isEmpty {
            Text("No unresolved conflicts.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.cloudSyncConflicts) { conflict in
              VStack(alignment: .leading, spacing: 6) {
                Text("\(conflict.entityType.rawValue.capitalized): \(conflict.summary)")
                  .font(.subheadline)
                Text("Local: \(conflict.localUpdatedAt.formatted()) | Remote: \(conflict.remoteUpdatedAt.formatted())")
                  .font(.caption)
                  .foregroundStyle(.secondary)

                HStack {
                  Button("Use Local") {
                    Task {
                      await appState.resolveCloudSyncConflict(conflict, policy: .preferLocal)
                    }
                  }
                  .buttonStyle(.bordered)

                  Button("Use Remote") {
                    Task {
                      await appState.resolveCloudSyncConflict(conflict, policy: .preferRemote)
                    }
                  }
                  .buttonStyle(.bordered)
                }
              }
              .padding(8)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
            }
          }

          ForEach(appState.cloudSyncDiagnostics, id: \.self) { line in
            Text(line)
              .font(.caption)
              .foregroundStyle(.secondary)
          }
        }
        .padding(.top, 8)
      }
    }
  }

  private func statusBadge(title: String, active: Bool) -> some View {
    HStack(spacing: 6) {
      Circle()
        .fill(active ? Color.green : SerenityPalette.textSecondary.opacity(0.6))
        .frame(width: 8, height: 8)
      Text(title)
        .font(.caption)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .background(SerenityPalette.innerCardBackground, in: Capsule())
    .overlay(Capsule().stroke(SerenityPalette.thinBorder, lineWidth: 1))
  }

  private func providerSummaryRow(title: String, detail: String, active: Bool) -> some View {
    HStack {
      VStack(alignment: .leading, spacing: 3) {
        HStack(spacing: 8) {
          Text(title)
            .font(.system(size: 21, weight: .semibold))
          Text(active ? "Connected" : "Disconnected")
            .font(.caption)
            .foregroundStyle(active ? .green : SerenityPalette.textSecondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background((active ? Color.green : SerenityPalette.textSecondary).opacity(0.15), in: Capsule())
        }

        Text(detail)
          .font(.system(size: 16, weight: .regular))
          .foregroundStyle(SerenityPalette.textSecondary)
      }

      Spacer()
    }
    .padding(12)
    .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(SerenityPalette.thinBorder, lineWidth: 1)
    )
  }
}

private struct ActionHubSectionView: View {
  @EnvironmentObject private var appState: AppState

  private enum HubTab: String, CaseIterable, Identifiable {
    case tasks
    case projects
    case calendar

    var id: String { rawValue }

    var title: String {
      switch self {
      case .tasks:
        return "Tasks"
      case .projects:
        return "Projects"
      case .calendar:
        return "Calendar"
      }
    }
  }

  private enum TaskListFilter: String, CaseIterable, Identifiable {
    case all
    case active
    case completed

    var id: String { rawValue }
  }

  @State private var activeTab: HubTab = .tasks
  @State private var taskFilter: TaskListFilter = .all
  @State private var searchQuery = ""
  @State private var showQuickAddForm = false

  @State private var newTaskTitle = ""
  @State private var newTaskPriority: TaskPriority = .medium
  @State private var includeDueDate = false
  @State private var dueDate = Date()
  @State private var subtaskDraftByTaskID: [String: String] = [:]

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      tabSelector

      switch activeTab {
      case .tasks:
        tasksView
      case .projects:
        projectsView
      case .calendar:
        calendarView
      }
    }
  }

  private var tabSelector: some View {
    HStack(spacing: 8) {
      ForEach(HubTab.allCases) { tab in
        Button(tab.title) {
          activeTab = tab
        }
        .buttonStyle(.plain)
        .font(.system(size: 15, weight: .medium))
        .padding(.horizontal, 20)
        .padding(.vertical, 9)
        .foregroundStyle(activeTab == tab ? Color.white : SerenityPalette.textSecondary)
        .background(
          RoundedRectangle(cornerRadius: 10, style: .continuous)
            .fill(activeTab == tab ? SerenityPalette.activeItemBackground : .clear)
        )
      }
    }
    .padding(6)
    .background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(SerenityPalette.thinBorder, lineWidth: 1)
    )
    .frame(width: 360, alignment: .leading)
  }

  private var tasksView: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack(alignment: .top, spacing: 14) {
        progressPanel
        quickAddPanel
      }

      HStack(spacing: 12) {
        HStack(spacing: 8) {
          Image(systemName: "magnifyingglass")
            .foregroundStyle(SerenityPalette.textSecondary)
          TextField("Search tasks, projects, or tags...", text: $searchQuery)
            .textFieldStyle(.plain)
            .font(.system(size: 17, weight: .regular))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(SerenityPalette.panelBackgroundRaised, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(SerenityPalette.thinBorder, lineWidth: 1)
        )

        Spacer(minLength: 8)

        ForEach(TaskListFilter.allCases) { filter in
          Button(filter.rawValue.capitalized) {
            taskFilter = filter
          }
          .buttonStyle(.plain)
          .font(.system(size: 15, weight: .medium))
          .padding(.horizontal, 20)
          .padding(.vertical, 11)
          .foregroundStyle(taskFilter == filter ? Color.white : SerenityPalette.textSecondary)
          .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .fill(taskFilter == filter ? SerenityPalette.activeItemBackground : SerenityPalette.panelBackgroundRaised)
          )
          .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
              .stroke(SerenityPalette.thinBorder, lineWidth: 1)
          )
        }
      }

      HStack(spacing: 8) {
        Button("Complete Selected") {
          Task { await appState.markSelectedTasksCompleted() }
        }
        .buttonStyle(.bordered)
        .disabled(appState.selectedTaskIDs.isEmpty)

        Button("Delete Selected", role: .destructive) {
          Task { await appState.deleteSelectedTasks() }
        }
        .buttonStyle(.bordered)
        .disabled(appState.selectedTaskIDs.isEmpty)
      }

      if displayedTasks.isEmpty {
        Text("No tasks match your current filters.")
          .foregroundStyle(SerenityPalette.textSecondary)
          .padding(.top, 4)
      } else {
        ForEach(displayedTasks) { task in
          taskRow(task)
        }
      }
    }
  }

  private var progressPanel: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack {
        Text("Overall Progress")
          .font(.title3)
        Spacer()
      }

      HStack(spacing: 18) {
        progressRing

        VStack(alignment: .leading, spacing: 8) {
          statLine("Completed", "\(completedCount)", tint: .green)
          statLine("Remaining", "\(max(totalTaskCount - completedCount, 0))", tint: .orange)
          statLine("Total Tasks", "\(totalTaskCount)", tint: SerenityPalette.accent)
        }
      }

      Divider()
        .overlay(SerenityPalette.thinBorder)

      Text("\(max(totalTaskCount - completedCount, 0)) tasks left to complete")
        .foregroundStyle(SerenityPalette.textSecondary)
    }
    .padding(18)
    .frame(width: 436, alignment: .leading)
    .background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .stroke(SerenityPalette.border, lineWidth: 1)
    )
  }

  private var quickAddPanel: some View {
    VStack(alignment: .leading, spacing: 10) {
      if showQuickAddForm {
        TextField("Task title", text: $newTaskTitle)
          .textFieldStyle(.plain)
          .padding(.horizontal, 12)
          .padding(.vertical, 10)
          .background(SerenityPalette.panelBackgroundRaised, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
              .stroke(SerenityPalette.thinBorder, lineWidth: 1)
          )

        HStack {
          Picker("Priority", selection: $newTaskPriority) {
            ForEach(TaskPriority.allCases, id: \.rawValue) { priority in
              Text(priority.rawValue.capitalized)
                .tag(priority)
            }
          }
          .frame(maxWidth: 180)

          Toggle("Due date", isOn: $includeDueDate)
            .toggleStyle(.switch)

          if includeDueDate {
            DatePicker("", selection: $dueDate, displayedComponents: [.date, .hourAndMinute])
              .labelsHidden()
          }
        }

        HStack {
          Button("Create Task") {
            Task {
              await appState.createTask(
                title: newTaskTitle,
                priority: newTaskPriority,
                dueDate: includeDueDate ? dueDate : nil,
                tags: [],
                subtaskTitles: []
              )
            }
            newTaskTitle = ""
            includeDueDate = false
            showQuickAddForm = false
          }
          .buttonStyle(.borderedProminent)
          .disabled(newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

          Button("Cancel") {
            showQuickAddForm = false
          }
          .buttonStyle(.bordered)
        }
      } else {
        Button {
          showQuickAddForm = true
        } label: {
          VStack(spacing: 8) {
            Image(systemName: "plus")
              .font(.system(size: 28, weight: .light))
              .foregroundStyle(SerenityPalette.textSecondary)
            Text("Add new task...")
              .font(.system(size: 18, weight: .medium))
              .foregroundStyle(SerenityPalette.textSecondary)
          }
          .frame(maxWidth: .infinity, minHeight: 178)
          .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
              .stroke(SerenityPalette.thinBorder, style: StrokeStyle(lineWidth: 1, dash: [6, 6]))
          )
        }
        .buttonStyle(.plain)
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 16, style: .continuous)
        .stroke(SerenityPalette.border, lineWidth: 1)
    )
  }

  @ViewBuilder
  private func taskRow(_ task: TaskEntity) -> some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(spacing: 12) {
        Button {
          appState.toggleTaskSelection(id: task.id)
        } label: {
          Image(systemName: appState.selectedTaskIDs.contains(task.id) ? "checkmark.circle.fill" : "circle")
            .foregroundStyle(appState.selectedTaskIDs.contains(task.id) ? SerenityPalette.accent : SerenityPalette.textSecondary)
        }
        .buttonStyle(.plain)

        Button {
          Task { await appState.toggleTaskCompletion(id: task.id) }
        } label: {
          Image(systemName: task.completed ? "checkmark.square.fill" : "square")
            .foregroundStyle(task.completed ? .green : SerenityPalette.textSecondary)
        }
        .buttonStyle(.plain)

        Text(task.title)
          .font(.system(size: 20, weight: .medium))
          .strikethrough(task.completed)
          .lineLimit(2)

        Spacer()

        Text(task.priority.rawValue.capitalized)
          .font(.caption)
          .padding(.horizontal, 10)
          .padding(.vertical, 4)
          .background(priorityColor(task.priority).opacity(0.18), in: Capsule())
      }

      HStack(spacing: 8) {
        chip("Created \(task.createdAt.formatted(date: .numeric, time: .omitted))")
        if let dueDate = task.dueDate {
          chip("Due \(dueDate.formatted(date: .numeric, time: .omitted))", tint: isOverdue(task) ? .red : SerenityPalette.accent)
        }
      }

      if !task.tags.isEmpty {
        HStack(spacing: 6) {
          ForEach(task.tags.prefix(4), id: \.self) { tag in
            chip(tag)
          }
          if task.tags.count > 4 {
            chip("+\(task.tags.count - 4)")
          }
        }
      }

      if !task.subtasks.isEmpty {
        VStack(alignment: .leading, spacing: 4) {
          ForEach(task.subtasks, id: \.id) { subtask in
            Button {
              Task { await appState.toggleSubtask(taskID: task.id, subtaskID: subtask.id) }
            } label: {
              HStack(spacing: 6) {
                Image(systemName: subtask.completed ? "checkmark.circle.fill" : "circle")
                  .foregroundStyle(subtask.completed ? .green : SerenityPalette.textSecondary)
                Text(subtask.title)
                  .font(.caption)
                  .strikethrough(subtask.completed)
                Spacer()
              }
            }
            .buttonStyle(.plain)
          }
        }
      }

      HStack {
        TextField("Add subtask", text: subtaskBinding(for: task.id))
          .textFieldStyle(.plain)
          .padding(.horizontal, 10)
          .padding(.vertical, 8)
          .background(SerenityPalette.panelBackgroundRaised, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
              .stroke(SerenityPalette.thinBorder, lineWidth: 1)
          )

        Button("Add") {
          let subtaskText = subtaskBinding(for: task.id).wrappedValue
          Task { await appState.addSubtask(taskID: task.id, title: subtaskText) }
          subtaskBinding(for: task.id).wrappedValue = ""
        }
        .buttonStyle(.bordered)

        Spacer()

        Button("Delete", role: .destructive) {
          Task { await appState.deleteTask(id: task.id) }
        }
        .buttonStyle(.bordered)
      }
    }
    .padding(14)
    .background(isOverdue(task) ? Color.red.opacity(0.14) : SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(isOverdue(task) ? Color.red.opacity(0.75) : SerenityPalette.border, lineWidth: 1)
    )
  }

  private var projectsView: some View {
    GroupBox("Projects") {
      VStack(alignment: .leading, spacing: 10) {
        if appState.projects.isEmpty {
          Text("No projects yet. Create one from ActionHub task assignments.")
            .foregroundStyle(SerenityPalette.textSecondary)
        } else {
          ForEach(appState.projects) { project in
            HStack {
              Text(project.name)
                .font(.title3)
              Spacer()
              Text(project.archived ? "Archived" : "Active")
                .font(.caption)
                .foregroundStyle(project.archived ? SerenityPalette.textSecondary : .green)
            }
            .padding(.vertical, 4)
          }
        }
      }
      .padding(.top, 4)
    }
  }

  private var calendarView: some View {
    GroupBox("Upcoming") {
      VStack(alignment: .leading, spacing: 10) {
        if dueTasksSorted.isEmpty {
          Text("No scheduled tasks.")
            .foregroundStyle(SerenityPalette.textSecondary)
        } else {
          ForEach(dueTasksSorted.prefix(20)) { task in
            HStack {
              Text(task.title)
              Spacer()
              if let dueDate = task.dueDate {
                Text(dueDate.formatted(date: .abbreviated, time: .shortened))
                  .font(.caption)
                  .foregroundStyle(SerenityPalette.textSecondary)
              }
            }
            .padding(.vertical, 4)
          }
        }
      }
      .padding(.top, 4)
    }
  }

  private var totalTaskCount: Int {
    appState.tasks.count
  }

  private var completedCount: Int {
    appState.tasks.filter(\.completed).count
  }

  private var displayedTasks: [TaskEntity] {
    let query = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

    return appState.tasks
      .filter { task in
        switch taskFilter {
        case .all:
          break
        case .active:
          if task.completed { return false }
        case .completed:
          if !task.completed { return false }
        }

        guard !query.isEmpty else { return true }
        let haystack = [
          task.title,
          task.description ?? "",
          task.tags.joined(separator: " "),
          task.subtasks.map(\.title).joined(separator: " "),
        ]
          .joined(separator: " ")
          .lowercased()
        return haystack.contains(query)
      }
      .sorted { lhs, rhs in
        (lhs.dueDate ?? lhs.createdAt) < (rhs.dueDate ?? rhs.createdAt)
      }
  }

  private var dueTasksSorted: [TaskEntity] {
    appState.tasks
      .filter { $0.dueDate != nil }
      .sorted { lhs, rhs in
        (lhs.dueDate ?? lhs.createdAt) < (rhs.dueDate ?? rhs.createdAt)
      }
  }

  private var progressRing: some View {
    let percent = totalTaskCount == 0 ? 0 : Int((Double(completedCount) / Double(totalTaskCount)) * 100)
    let progress = totalTaskCount == 0 ? 0 : Double(completedCount) / Double(totalTaskCount)

    return ZStack {
      Circle()
        .stroke(SerenityPalette.thinBorder, lineWidth: 11)
      Circle()
        .trim(from: 0, to: progress)
        .stroke(SerenityPalette.accent, style: StrokeStyle(lineWidth: 11, lineCap: .round))
        .rotationEffect(.degrees(-90))
      Text("\(percent)%")
        .font(.title2.bold())
    }
    .frame(width: 108, height: 108)
  }

  private func statLine(_ label: String, _ value: String, tint: Color) -> some View {
    HStack {
      Circle()
        .fill(tint)
        .frame(width: 7, height: 7)
      Text(label)
        .foregroundStyle(SerenityPalette.textSecondary)
      Spacer()
      Text(value)
        .foregroundStyle(tint)
        .font(.title3.weight(.semibold))
    }
  }

  private func chip(_ value: String, tint: Color = SerenityPalette.textSecondary) -> some View {
    Text(value)
      .font(.system(size: 12, weight: .medium))
      .foregroundStyle(tint)
      .padding(.horizontal, 10)
      .padding(.vertical, 4)
      .background(SerenityPalette.innerCardBackground, in: Capsule())
      .overlay(Capsule().stroke(SerenityPalette.thinBorder, lineWidth: 1))
  }

  private func isOverdue(_ task: TaskEntity) -> Bool {
    guard let dueDate = task.dueDate else { return false }
    return !task.completed && dueDate < Calendar.current.startOfDay(for: Date())
  }

  private func priorityColor(_ priority: TaskPriority) -> Color {
    switch priority {
    case .low:
      return .mint
    case .medium:
      return .orange
    case .high:
      return .red
    }
  }

  private func subtaskBinding(for taskID: String) -> Binding<String> {
    Binding(
      get: { subtaskDraftByTaskID[taskID, default: ""] },
      set: { subtaskDraftByTaskID[taskID] = $0 }
    )
  }

  private func section(for resultType: GlobalSearchResultType) -> AppSection {
    switch resultType {
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
}

private struct TodaySectionView: View {
  @EnvironmentObject private var appState: AppState

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack(spacing: 12) {
        MetricTile(title: "Due Today", value: "\(appState.todayTasks.count)", tint: .blue)
        MetricTile(title: "Overdue", value: "\(appState.overdueTasks.count)", tint: .red)
        MetricTile(title: "Completed Today", value: "\(completedTodayCount)", tint: .green)
      }

      GroupBox("Overdue") {
        taskList(tasks: appState.overdueTasks)
          .padding(.top, 8)
      }

      GroupBox("Due Today") {
        taskList(tasks: appState.todayTasks)
          .padding(.top, 8)
      }

      Button("Refresh") {
        Task {
          await appState.refreshCoreWorkflowData()
        }
      }
    }
  }

  private var completedTodayCount: Int {
    let today = Calendar.current.startOfDay(for: Date())
    return appState.tasks.filter { task in
      guard let completedAt = task.completedAt else { return false }
      return Calendar.current.isDate(completedAt, inSameDayAs: today)
    }.count
  }

  @ViewBuilder
  private func taskList(tasks: [TaskEntity]) -> some View {
    if tasks.isEmpty {
      Text("No tasks")
        .foregroundStyle(.secondary)
    } else {
      VStack(alignment: .leading, spacing: 8) {
        ForEach(tasks) { task in
          HStack {
            Text(task.title)
            Spacer()
            if let dueDate = task.dueDate {
              Text(dueDate, style: .time)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Button(task.completed ? "Reopen" : "Complete") {
              Task {
                await appState.toggleTaskCompletion(id: task.id)
              }
            }
            .buttonStyle(.bordered)
          }
          .padding(8)
          .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
        }
      }
    }
  }
}

private struct JournalSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var newEntryTitle = ""
  @State private var newEntryContent = ""
  @State private var newEntryMood: JournalMood?
  @State private var newEntryTags = ""

  @State private var editingEntry: JournalEntryEntity?

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("New Journal Entry") {
        VStack(alignment: .leading, spacing: 10) {
          TextField("Title (optional)", text: $newEntryTitle)
          TextEditor(text: $newEntryContent)
            .frame(minHeight: 90)

          HStack {
            Picker("Mood", selection: $newEntryMood) {
              Text("None").tag(Optional<JournalMood>.none)
              ForEach(journalMoods, id: \.rawValue) { mood in
                Text(mood.rawValue.capitalized)
                  .tag(Optional(mood))
              }
            }
            .frame(maxWidth: 220)

            TextField("Tags (comma-separated)", text: $newEntryTags)
          }

          HStack {
            Button("Create Entry") {
              let tags = csvValues(from: newEntryTags)
              Task {
                await appState.createJournalEntry(
                  title: newEntryTitle,
                  content: newEntryContent,
                  mood: newEntryMood,
                  tags: tags
                )
              }

              newEntryTitle = ""
              newEntryContent = ""
              newEntryMood = nil
              newEntryTags = ""
            }
            .buttonStyle(.borderedProminent)

            Button("Refresh") {
              Task {
                await appState.refreshCoreWorkflowData()
              }
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Filters") {
        VStack(alignment: .leading, spacing: 10) {
          Toggle("Filter by date range", isOn: $appState.journalDateRangeEnabled)
            .onChange(of: appState.journalDateRangeEnabled) { _, _ in
              Task {
                await appState.refreshCoreWorkflowData()
              }
            }

          if appState.journalDateRangeEnabled {
            HStack {
              DatePicker("From", selection: $appState.journalRangeStartDate, displayedComponents: .date)
              DatePicker("To", selection: $appState.journalRangeEndDate, displayedComponents: .date)
              Button("Apply") {
                Task {
                  await appState.refreshCoreWorkflowData()
                }
              }
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Entries") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.filteredJournalEntries.isEmpty {
            Text("No journal entries available")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.filteredJournalEntries) { entry in
              VStack(alignment: .leading, spacing: 6) {
                HStack {
                  Text(entry.title ?? "Untitled entry")
                    .font(.headline)
                  if entry.pinned {
                    Image(systemName: "pin.fill")
                      .foregroundStyle(.orange)
                  }
                  Spacer()
                  Text(entry.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                Text(entry.content)
                  .lineLimit(3)
                  .font(.subheadline)

                HStack(spacing: 8) {
                  if !entry.tags.isEmpty {
                    Text(entry.tags.joined(separator: ", "))
                      .font(.caption)
                      .foregroundStyle(.secondary)
                  }

                  Spacer()

                  Button(entry.pinned ? "Unpin" : "Pin") {
                    Task {
                      await appState.toggleJournalPin(id: entry.id)
                    }
                  }
                  .buttonStyle(.bordered)

                  Button("Edit") {
                    editingEntry = entry
                  }
                  .buttonStyle(.bordered)

                  Button("Delete", role: .destructive) {
                    Task {
                      await appState.deleteJournalEntry(id: entry.id)
                    }
                  }
                  .buttonStyle(.borderless)
                }
              }
              .padding(10)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 10))
            }
          }
        }
        .padding(.top, 8)
      }
    }
    .sheet(item: $editingEntry) { entry in
      JournalEntryEditorView(entry: entry) { updatedTitle, updatedContent, updatedMood, updatedTags in
        Task {
          await appState.updateJournalEntry(
            id: entry.id,
            title: updatedTitle,
            content: updatedContent,
            mood: updatedMood,
            tags: updatedTags
          )
        }
      }
      .frame(minWidth: 460, minHeight: 380)
    }
  }

  private var journalMoods: [JournalMood] {
    [.happy, .neutral, .sad, .excited, .stressed]
  }

  private func csvValues(from value: String) -> [String] {
    value
      .split(separator: ",")
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { !$0.isEmpty }
  }
}

private struct GoalsSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var newGoalTitle = ""
  @State private var newGoalTarget = "5"
  @State private var newGoalType: GoalType = .weeklyTasks
  @State private var newGoalPriority: GoalPriority = .medium

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("New Goal") {
        VStack(alignment: .leading, spacing: 10) {
          TextField("Goal title", text: $newGoalTitle)

          HStack {
            TextField("Target", text: $newGoalTarget)
              .frame(maxWidth: 140)

            Picker("Type", selection: $newGoalType) {
              ForEach(goalTypes, id: \.rawValue) { type in
                Text(type.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                  .tag(type)
              }
            }
            .frame(maxWidth: 220)

            Picker("Priority", selection: $newGoalPriority) {
              ForEach(goalPriorities, id: \.rawValue) { priority in
                Text(priority.rawValue.capitalized)
                  .tag(priority)
              }
            }
            .frame(maxWidth: 180)
          }

          HStack {
            Button("Create Goal") {
              let target = Double(newGoalTarget) ?? 1
              Task {
                await appState.createGoal(
                  title: newGoalTitle,
                  target: target,
                  type: newGoalType,
                  priority: newGoalPriority
                )
              }

              newGoalTitle = ""
              newGoalTarget = "5"
            }
            .buttonStyle(.borderedProminent)

            Button("Refresh") {
              Task {
                await appState.refreshCoreWorkflowData()
              }
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Goals") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.goals.isEmpty {
            Text("No goals found")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.goals) { goal in
              VStack(alignment: .leading, spacing: 8) {
                HStack {
                  VStack(alignment: .leading, spacing: 3) {
                    Text(goal.title)
                      .font(.headline)

                    Text("\(goal.progress.current, specifier: "%.0f") / \(goal.progress.target, specifier: "%.0f") (\(goal.progress.percentage, specifier: "%.0f")%)")
                      .font(.caption)
                      .foregroundStyle(.secondary)
                  }

                  Spacer()

                  Text(goal.status.rawValue.capitalized)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(goal.status == .completed ? Color.green.opacity(0.2) : Color.blue.opacity(0.2), in: Capsule())
                }

                ProgressView(value: goal.progress.percentage, total: 100)

                HStack {
                  Button("Increment") {
                    Task {
                      await appState.incrementGoalProgress(id: goal.id)
                    }
                  }
                  .buttonStyle(.bordered)

                  Spacer()

                  Button("Delete", role: .destructive) {
                    Task {
                      await appState.deleteGoal(id: goal.id)
                    }
                  }
                  .buttonStyle(.borderless)
                }
              }
              .padding(10)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 10))
            }
          }
        }
        .padding(.top, 8)
      }
    }
  }

  private var goalTypes: [GoalType] {
    [.weeklyTasks, .projectTasks, .priorityTasks, .dailyStreak, .journalWeekly, .completionRate]
  }

  private var goalPriorities: [GoalPriority] {
    [.low, .medium, .high]
  }
}

private struct ProjectsSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var newProjectName = ""
  @State private var newProjectDescription = ""
  @State private var newProjectColor = "#4A90E2"
  @State private var editingProject: ProjectEntity?

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("New Project") {
        VStack(alignment: .leading, spacing: 10) {
          TextField("Project name", text: $newProjectName)
          TextField("Description", text: $newProjectDescription)
          TextField("Color hex", text: $newProjectColor)

          HStack {
            Button("Create Project") {
              Task {
                await appState.createProject(
                  name: newProjectName,
                  description: newProjectDescription,
                  color: newProjectColor
                )
              }

              newProjectName = ""
              newProjectDescription = ""
              newProjectColor = "#4A90E2"
            }
            .buttonStyle(.borderedProminent)

            Toggle("Include archived", isOn: $appState.includeArchivedProjects)
              .onChange(of: appState.includeArchivedProjects) { _, _ in
                Task {
                  await appState.refreshCoreWorkflowData()
                }
              }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Projects") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.projects.isEmpty {
            Text("No projects available")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.projects) { project in
              VStack(alignment: .leading, spacing: 8) {
                HStack {
                  VStack(alignment: .leading, spacing: 3) {
                    Text(project.name)
                      .font(.headline)
                    Text(project.description ?? "No description")
                      .font(.caption)
                      .foregroundStyle(.secondary)
                    Text("Color: \(project.color)")
                      .font(.caption2)
                      .foregroundStyle(.secondary)
                  }

                  Spacer()

                  if project.archived {
                    Text("Archived")
                      .font(.caption)
                      .padding(.horizontal, 8)
                      .padding(.vertical, 2)
                      .background(Color.secondary.opacity(0.2), in: Capsule())
                  }
                }

                HStack {
                  Button(project.archived ? "Unarchive" : "Archive") {
                    Task {
                      await appState.toggleProjectArchive(id: project.id)
                    }
                  }
                  .buttonStyle(.bordered)

                  Button("Edit") {
                    editingProject = project
                  }
                  .buttonStyle(.bordered)

                  Spacer()

                  Button("Delete", role: .destructive) {
                    Task {
                      await appState.deleteProject(id: project.id)
                    }
                  }
                  .buttonStyle(.borderless)
                }
              }
              .padding(10)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 10))
            }
          }
        }
        .padding(.top, 8)
      }
    }
    .sheet(item: $editingProject) { project in
      ProjectEditorView(project: project) { name, description, color in
        Task {
          await appState.updateProject(id: project.id, name: name, description: description, color: color)
        }
      }
      .frame(minWidth: 420, minHeight: 260)
    }
  }
}

struct InsightsSectionView: View {
  @EnvironmentObject private var appState: AppState

  @State private var newCredentialProvider: AICredentialProvider = .openai
  @State private var newCredentialName = ""
  @State private var newCredentialAPIKey = ""
  @State private var newCredentialModel = ""
  @State private var insightNoteDrafts: [String: String] = [:]

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("AI Status and Settings") {
        VStack(alignment: .leading, spacing: 10) {
          Text(appState.aiStatusMessage)
            .font(.caption)
            .foregroundStyle(.secondary)

          HStack {
            Picker("Active Provider", selection: Binding(
              get: { appState.aiSettings.activeProvider?.rawValue ?? "none" },
              set: { value in
                Task {
                  await appState.setAIActiveProvider(AICredentialProvider(rawValue: value))
                }
              }
            )) {
              Text("Auto").tag("none")
              ForEach([AICredentialProvider.openai, .gemini, .anthropic], id: \.rawValue) { provider in
                Text(provider.rawValue.capitalized).tag(provider.rawValue)
              }
            }
            .frame(maxWidth: 230)

            Toggle("Auto analyze", isOn: Binding(
              get: { appState.aiSettings.autoAnalyze },
              set: { enabled in
                Task {
                  await appState.setAIAutoAnalyze(enabled)
                }
              }
            ))
            .toggleStyle(.switch)
            .frame(maxWidth: 180)

            Picker("Frequency", selection: Binding(
              get: { appState.aiSettings.analysisFrequency },
              set: { frequency in
                Task {
                  await appState.setAIAnalysisFrequency(frequency)
                }
              }
            )) {
              ForEach([AIAnalysisFrequency.daily, .weekly, .manual], id: \.rawValue) { frequency in
                Text(frequency.rawValue.capitalized).tag(frequency)
              }
            }
            .frame(maxWidth: 180)
          }

          HStack {
            Toggle("Use tasks", isOn: Binding(
              get: { appState.aiSettings.dataTypes.includeTasks },
              set: { enabled in
                Task {
                  await appState.setAIDataTypes(
                    includeTasks: enabled,
                    includeJournal: appState.aiSettings.dataTypes.includeJournal,
                    includeProjects: appState.aiSettings.dataTypes.includeProjects
                  )
                }
              }
            ))
            .toggleStyle(.switch)

            Toggle("Use journal", isOn: Binding(
              get: { appState.aiSettings.dataTypes.includeJournal },
              set: { enabled in
                Task {
                  await appState.setAIDataTypes(
                    includeTasks: appState.aiSettings.dataTypes.includeTasks,
                    includeJournal: enabled,
                    includeProjects: appState.aiSettings.dataTypes.includeProjects
                  )
                }
              }
            ))
            .toggleStyle(.switch)

            Toggle("Use projects", isOn: Binding(
              get: { appState.aiSettings.dataTypes.includeProjects },
              set: { enabled in
                Task {
                  await appState.setAIDataTypes(
                    includeTasks: appState.aiSettings.dataTypes.includeTasks,
                    includeJournal: appState.aiSettings.dataTypes.includeJournal,
                    includeProjects: enabled
                  )
                }
              }
            ))
            .toggleStyle(.switch)
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Credentials and Models") {
        VStack(alignment: .leading, spacing: 10) {
          HStack {
            Picker("Provider", selection: $newCredentialProvider) {
              ForEach([AICredentialProvider.openai, .gemini, .anthropic], id: \.rawValue) { provider in
                Text(provider.rawValue.capitalized).tag(provider)
              }
            }
            .frame(maxWidth: 200)

            TextField("Credential name", text: $newCredentialName)
              .frame(maxWidth: 220)
          }

          SecureField("API key", text: $newCredentialAPIKey)

          Picker("Model preference", selection: $newCredentialModel) {
            Text("Default").tag("")
            ForEach(appState.aiModelCatalog[newCredentialProvider] ?? [], id: \.self) { model in
              Text(model).tag(model)
            }
          }
          .frame(maxWidth: 280)

          Button("Add Credential") {
            Task {
              await appState.addAICredential(
                provider: newCredentialProvider,
                name: newCredentialName,
                apiKey: newCredentialAPIKey,
                modelPreference: newCredentialModel.isEmpty ? nil : newCredentialModel
              )
              newCredentialName = ""
              newCredentialAPIKey = ""
              newCredentialModel = ""
            }
          }
          .buttonStyle(.borderedProminent)

          if appState.aiCredentials.isEmpty {
            Text("No credentials configured.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.aiCredentials) { credential in
              VStack(alignment: .leading, spacing: 8) {
                HStack {
                  VStack(alignment: .leading, spacing: 2) {
                    Text(credential.name)
                    Text("\(credential.provider.rawValue.capitalized) • priority \(credential.priority)")
                      .font(.caption)
                      .foregroundStyle(.secondary)
                  }
                  Spacer()
                  Toggle("Enabled", isOn: Binding(
                    get: { credential.enabled },
                    set: { enabled in
                      Task {
                        await appState.updateAICredentialEnabled(id: credential.id, enabled: enabled)
                      }
                    }
                  ))
                  .toggleStyle(.switch)
                  .labelsHidden()

                  Button("Delete", role: .destructive) {
                    Task {
                      await appState.deleteAICredential(id: credential.id)
                    }
                  }
                  .buttonStyle(.borderless)
                }

                Picker("Model", selection: Binding(
                  get: { credential.modelPreference ?? "" },
                  set: { model in
                    Task {
                      await appState.updateAICredentialModel(id: credential.id, modelPreference: model.isEmpty ? nil : model)
                    }
                  }
                )) {
                  Text("Default").tag("")
                  ForEach(appState.aiModelCatalog[credential.provider] ?? [], id: \.self) { model in
                    Text(model).tag(model)
                  }
                }
                .frame(maxWidth: 260)
              }
              .padding(8)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("AI Actions") {
        VStack(alignment: .leading, spacing: 10) {
          if !appState.aiCredentials.contains(where: { $0.enabled }) {
            Text("No-key mode: add and enable at least one provider credential to run AI actions.")
              .font(.caption)
              .foregroundStyle(.orange)
          }

          HStack {
            Button("Generate Insights") {
              Task {
                await appState.runAIAnalysis()
              }
            }
            .buttonStyle(.borderedProminent)

            Button("Weekly Recap") {
              Task {
                await appState.generateAIRecap(type: .weekly)
              }
            }

            Button("Monthly Recap") {
              Task {
                await appState.generateAIRecap(type: .monthly)
              }
            }
          }

          HStack {
            Button("Task Summary") {
              Task {
                await appState.generateAISummary(type: .tasks)
              }
            }

            Button("Journal Summary") {
              Task {
                await appState.generateAISummary(type: .journal)
              }
            }

            Button("Combined Summary") {
              Task {
                await appState.generateAISummary(type: .combined)
              }
            }

            Button("Refresh") {
              Task {
                await appState.refreshAIWorkflows()
              }
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Insights") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.aiInsights.isEmpty {
            Text("No insights generated yet.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.aiInsights.prefix(12)) { insight in
              VStack(alignment: .leading, spacing: 8) {
                Text(insight.title)
                  .font(.headline)
                Text(insight.description)
                  .font(.subheadline)
                Text("Confidence: \(Int(insight.confidence * 100))%")
                  .font(.caption)
                  .foregroundStyle(.secondary)

                TextField("Notes", text: Binding(
                  get: { insightNoteDrafts[insight.id] ?? insight.userNotes ?? "" },
                  set: { insightNoteDrafts[insight.id] = $0 }
                ))

                HStack {
                  Button("Helpful") {
                    Task {
                      await appState.updateAIInsightFeedback(
                        id: insight.id,
                        userRating: insight.userRating,
                        dismissed: nil,
                        markedHelpful: true,
                        userNotes: insightNoteDrafts[insight.id]
                      )
                    }
                  }

                  Button("Dismiss") {
                    Task {
                      await appState.updateAIInsightFeedback(
                        id: insight.id,
                        userRating: insight.userRating,
                        dismissed: true,
                        markedHelpful: nil,
                        userNotes: insightNoteDrafts[insight.id]
                      )
                    }
                  }

                  Spacer()

                  ForEach(1...5, id: \.self) { rating in
                    Button("\(rating)") {
                      Task {
                        await appState.updateAIInsightFeedback(
                          id: insight.id,
                          userRating: rating,
                          dismissed: nil,
                          markedHelpful: nil,
                          userNotes: insightNoteDrafts[insight.id]
                        )
                      }
                    }
                    .buttonStyle(.bordered)
                  }
                }
              }
              .padding(8)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Recaps") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.aiRecaps.isEmpty {
            Text("No recaps generated yet.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.aiRecaps.prefix(8)) { recap in
              VStack(alignment: .leading, spacing: 6) {
                HStack {
                  Text(recap.title)
                    .font(.headline)
                  Spacer()
                  Text(recap.type.rawValue.capitalized)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Text(recap.summary)
                  .font(.subheadline)
                HStack {
                  Button("Mark viewed") {
                    Task {
                      await appState.markRecapViewed(id: recap.id)
                    }
                  }
                  Button(recap.favorited ? "Unfavorite" : "Favorite") {
                    Task {
                      await appState.toggleRecapFavorite(id: recap.id)
                    }
                  }
                }
              }
              .padding(8)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Summaries and Usage") {
        VStack(alignment: .leading, spacing: 10) {
          if appState.aiSummaries.isEmpty {
            Text("No summaries generated yet.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.aiSummaries.prefix(10)) { summary in
              VStack(alignment: .leading, spacing: 6) {
                HStack {
                  Text(summary.title)
                  Spacer()
                  Text("\(summary.wordCount) words")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Text(summary.content)
                  .lineLimit(3)
                  .font(.caption)
                HStack {
                  Button("Export") {
                    Task {
                      await appState.exportAISummary(id: summary.id)
                    }
                  }
                  Button("Delete", role: .destructive) {
                    Task {
                      await appState.deleteAISummary(id: summary.id)
                    }
                  }
                }
              }
              .padding(8)
              .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 8))
            }
          }

          if let path = appState.lastSummaryExportPath {
            Text("Last exported summary: \(path)")
              .font(.caption)
              .foregroundStyle(.secondary)
              .textSelection(.enabled)
          }

          Divider()
          Text("Recent Usage")
            .font(.subheadline)
          if appState.aiUsageEntries.isEmpty {
            Text("No usage records yet.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.aiUsageEntries.prefix(8)) { usage in
              HStack {
                Text("\(usage.provider.rawValue.capitalized) • \(usage.operation.rawValue)")
                Spacer()
                Text("\(usage.totalTokens) tokens")
                  .font(.caption)
                  .foregroundStyle(.secondary)
              }
              .font(.caption)
            }
          }
        }
        .padding(.top, 8)
      }
    }
  }
}

private struct DatabaseSectionView: View {
  @EnvironmentObject private var appState: AppState

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack {
        Spacer()
        Button("Refresh") {
          Task {
            await appState.refreshCoreWorkflowData()
            await appState.refreshDatabaseManagement()
          }
        }
        .buttonStyle(.bordered)
        .controlSize(.large)

        Button("Configure Database") {
          appState.setSection(.settings)
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
      }

      HStack(spacing: 10) {
        Image(systemName: "checkmark.circle.fill")
          .foregroundStyle(.green)
        Text("Connected to \(appState.backendSelectionState.activeProfile.title.uppercased())")
          .font(.system(size: 20, weight: .semibold))
        Spacer()
      }
      .padding(.horizontal, 14)
      .padding(.vertical, 10)
      .background(Color.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .stroke(Color.green.opacity(0.45), lineWidth: 1)
      )

      HStack(alignment: .top, spacing: 16) {
        GroupBox("Database Statistics") {
          VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
              statMetricCard(title: "Size", value: sqlitePath == nil ? "N/A" : "Local")
              statMetricCard(title: "Records", value: "\(recordCount)")
              statMetricCard(title: "Tasks", value: "\(appState.tasks.count)")
              statMetricCard(title: "Error Rate", value: databaseHealthErrorRate)
            }

            VStack(alignment: .leading, spacing: 8) {
              Text("Record Breakdown")
                .font(.system(size: 21, weight: .semibold))

              breakdownRow("Tasks", value: "\(appState.tasks.count)")
              breakdownRow("Projects", value: "\(appState.projects.count)")
              breakdownRow("Journal Entries", value: "\(appState.journalEntries.count)")
              breakdownRow("Goals", value: "\(appState.goals.count)")
            }

            Divider()
              .overlay(SerenityPalette.thinBorder)

            VStack(alignment: .leading, spacing: 8) {
              Text("Performance Metrics")
                .font(.system(size: 21, weight: .semibold))

              breakdownRow("Integrity Check", value: appState.databaseIntegrityCheckResult)
              breakdownRow("Last Backup", value: appState.lastDatabaseBackupPath == nil ? "Not created" : "Available")
              breakdownRow("Last Export", value: appState.lastDatabaseExportPath == nil ? "Not exported" : "Available")
            }
          }
          .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)

        VStack(spacing: 16) {
          GroupBox("Quick Actions") {
            VStack(alignment: .leading, spacing: 10) {
              Button("Create Backup") {
                Task { await appState.createDatabaseBackup() }
              }
              .buttonStyle(.borderedProminent)

              Button("Integrity Check") {
                Task { await appState.runDatabaseIntegrityCheck() }
              }
              .buttonStyle(.bordered)

              Button("Export Snapshot") {
                Task { await appState.exportCoreDataSnapshot() }
              }
              .buttonStyle(.bordered)

              Button("Run Bootstrap") {
                Task { await appState.bootstrapLocalDatabase() }
              }
              .buttonStyle(.bordered)
            }
            .padding(.top, 4)
          }

          GroupBox("Current Configuration") {
            VStack(alignment: .leading, spacing: 6) {
              breakdownRow("Database Type", value: appState.backendSelectionState.activeProfile.title)
              breakdownRow("SQLite Path", value: sqlitePath ?? "Unavailable")
            }
            .padding(.top, 4)
          }
        }
        .frame(width: 320)
      }

      GroupBox("Diagnostics") {
        VStack(alignment: .leading, spacing: 6) {
          if appState.databaseManagementLines.isEmpty {
            Text("No diagnostics available yet.")
              .foregroundStyle(SerenityPalette.textSecondary)
          } else {
            ForEach(appState.databaseManagementLines, id: \.self) { line in
              Text(line)
                .font(.caption)
                .textSelection(.enabled)
            }
          }
        }
        .padding(.top, 8)
      }
    }
  }

  private var recordCount: Int {
    appState.tasks.count + appState.projects.count + appState.journalEntries.count + appState.goals.count
  }

  private var sqlitePath: String? {
    appState.databaseManagementLines
      .first(where: { $0.hasPrefix("SQLite path: ") })?
      .replacingOccurrences(of: "SQLite path: ", with: "")
  }

  private var databaseHealthErrorRate: String {
    appState.databaseIntegrityCheckResult.lowercased().contains("ok") ? "0%" : "N/A"
  }

  private func breakdownRow(_ label: String, value: String) -> some View {
    HStack {
      Text(label)
        .foregroundStyle(SerenityPalette.textSecondary)
      Spacer()
      Text(value)
        .lineLimit(1)
    }
    .font(.system(size: 16, weight: .regular))
  }

  private func statMetricCard(title: String, value: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title.uppercased())
        .font(.caption2)
        .foregroundStyle(SerenityPalette.textSecondary)
      Text(value)
        .font(.system(size: 34, weight: .bold))
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 10)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(SerenityPalette.innerCardBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(SerenityPalette.thinBorder, lineWidth: 1)
    )
  }
}

private struct SettingsSectionView: View {
  @EnvironmentObject private var appState: AppState

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      GroupBox("Backend Configuration") {
        VStack(alignment: .leading, spacing: 10) {
          Picker("Primary backend", selection: $appState.settings.backendProfile) {
            ForEach(BackendProfile.allCases) { profile in
              Text(profile.title).tag(profile)
            }
          }
          .frame(maxWidth: 260)

          let validation = appState.validationState(for: appState.settings.backendProfile)
          Text(validation.message)
            .font(.caption)
            .foregroundStyle(validation.isAvailable ? Color.secondary : Color.orange)

          Button("Validate active backend") {
            Task {
              await appState.refreshActiveBackendValidation()
            }
          }

          backendSwitchStatus
        }
        .padding(.top, 8)
      }

      GroupBox("Backend Diagnostics") {
        VStack(alignment: .leading, spacing: 8) {
          if appState.backendDiagnosticsLines.isEmpty {
            Text("No diagnostics available yet.")
              .foregroundStyle(.secondary)
          } else {
            ForEach(appState.backendDiagnosticsLines, id: \.self) { line in
              Text(line)
                .font(.caption)
                .textSelection(.enabled)
            }
          }

          Button("Refresh diagnostics") {
            Task {
              await appState.refreshActiveBackendValidation()
              await appState.refreshBackendDiagnostics()
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("Auth Session") {
        VStack(alignment: .leading, spacing: 8) {
          authSessionStatus

          Button("Sign out") {
            Task {
              await appState.logout()
            }
          }
        }
        .padding(.top, 8)
      }

      GroupBox("App Lock") {
        VStack(alignment: .leading, spacing: 10) {
          Toggle("Enable local app lock", isOn: $appState.settings.localLockEnabled)

          Text(appState.statusMessage(for: appState.localLockStatus))
            .font(.caption)
            .foregroundStyle(.secondary)

          HStack {
            Button("Lock now") {
              Task {
                await appState.lockAppNow()
              }
            }

            Button("Unlock") {
              Task {
                await appState.unlockAppWithConfiguredPassword()
              }
            }
          }

          biometricStatus
        }
        .padding(.top, 8)
      }

      GroupBox("Local Database") {
        VStack(alignment: .leading, spacing: 8) {
          databaseStatusContent

          Button("Run bootstrap") {
            Task {
              await appState.bootstrapLocalDatabase()
            }
          }
        }
        .padding(.top, 8)
      }
    }
    .onChange(of: appState.settings.backendProfile) { _, newValue in
      Task {
        await appState.handleBackendProfileSelection(newValue)
      }
    }
    .onChange(of: appState.settings.localLockEnabled) { _, newValue in
      Task {
        await appState.handleLocalLockToggle(newValue)
      }
    }
  }

  @ViewBuilder
  private var backendSwitchStatus: some View {
    switch appState.backendSwitchState {
    case .idle:
      EmptyView()
    case .switching(let target):
      Label("Switching to \(target.title)...", systemImage: "arrow.triangle.2.circlepath")
        .font(.caption)
    case .succeeded(let message):
      Text(message)
        .font(.caption)
        .foregroundStyle(.green)
    case .failed(let message):
      Text(message)
        .font(.caption)
        .foregroundStyle(.red)
    }
  }

  @ViewBuilder
  private var authSessionStatus: some View {
    switch appState.authSessionState {
    case .unauthenticated:
      Text("Not signed in")
        .foregroundStyle(.secondary)
    case .authenticating:
      Text("Authenticating...")
        .foregroundStyle(.secondary)
    case .authenticated(let session):
      Text("Signed in as \(session.userEmail)")
      Text("User ID: \(session.userID)")
        .font(.caption)
        .foregroundStyle(.secondary)
    case .refreshing:
      Text("Refreshing session...")
        .foregroundStyle(.secondary)
    case .failed(let message):
      Text("Auth error: \(message)")
        .foregroundStyle(.red)
    }
  }

  @ViewBuilder
  private var biometricStatus: some View {
    switch appState.biometricAvailability {
    case .available:
      Button("Unlock with Touch ID") {
        Task {
          await appState.unlockAppWithBiometrics()
        }
      }
    case .unavailable(let reason):
      Text("Touch ID unavailable: \(reason)")
        .font(.caption)
        .foregroundStyle(.secondary)
    }
  }

  @ViewBuilder
  private var databaseStatusContent: some View {
    switch appState.databaseBootstrapState {
    case .idle:
      Text("Local database bootstrap has not started yet.")
        .foregroundStyle(.secondary)
    case .bootstrapping:
      Label("Applying migrations...", systemImage: "arrow.triangle.2.circlepath")
    case .ready(let path, let appliedCount):
      VStack(alignment: .leading, spacing: 4) {
        Text("Database ready")
        Text(path)
          .font(.caption)
          .foregroundStyle(.secondary)
          .textSelection(.enabled)
        Text("Migrations applied this run: \(appliedCount)")
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    case .failed(let message):
      Text("Bootstrap failed: \(message)")
        .foregroundStyle(.red)
    }
  }
}

private struct MetricTile: View {
  let title: String
  let value: String
  let tint: Color

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title)
        .font(.caption)
        .foregroundStyle(.secondary)
      Text(value)
        .font(.system(size: 24, weight: .bold, design: .rounded))
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(tint.opacity(0.32), lineWidth: 1)
    )
  }
}

private struct JournalEntryEditorView: View {
  let entry: JournalEntryEntity
  let onSave: (String, String, JournalMood?, [String]) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var title: String
  @State private var content: String
  @State private var mood: JournalMood?
  @State private var tags: String

  init(entry: JournalEntryEntity, onSave: @escaping (String, String, JournalMood?, [String]) -> Void) {
    self.entry = entry
    self.onSave = onSave
    _title = State(initialValue: entry.title ?? "")
    _content = State(initialValue: entry.content)
    _mood = State(initialValue: entry.mood)
    _tags = State(initialValue: entry.tags.joined(separator: ", "))
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Edit Journal Entry")
        .font(.headline)

      TextField("Title", text: $title)
      TextEditor(text: $content)
        .frame(minHeight: 120)

      Picker("Mood", selection: $mood) {
        Text("None").tag(Optional<JournalMood>.none)
        ForEach([JournalMood.happy, .neutral, .sad, .excited, .stressed], id: \.rawValue) { moodValue in
          Text(moodValue.rawValue.capitalized)
            .tag(Optional(moodValue))
        }
      }
      .frame(maxWidth: 240)

      TextField("Tags (comma-separated)", text: $tags)

      HStack {
        Spacer()
        Button("Cancel") {
          dismiss()
        }
        Button("Save") {
          let splitTags = tags
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

          onSave(title, content, mood, splitTags)
          dismiss()
        }
        .buttonStyle(.borderedProminent)
      }
    }
    .padding(20)
  }
}

private struct ProjectEditorView: View {
  let project: ProjectEntity
  let onSave: (String, String, String) -> Void

  @Environment(\.dismiss) private var dismiss

  @State private var name: String
  @State private var description: String
  @State private var color: String

  init(project: ProjectEntity, onSave: @escaping (String, String, String) -> Void) {
    self.project = project
    self.onSave = onSave
    _name = State(initialValue: project.name)
    _description = State(initialValue: project.description ?? "")
    _color = State(initialValue: project.color)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Edit Project")
        .font(.headline)

      TextField("Name", text: $name)
      TextField("Description", text: $description)
      TextField("Color", text: $color)

      HStack {
        Spacer()
        Button("Cancel") {
          dismiss()
        }
        Button("Save") {
          onSave(name, description, color)
          dismiss()
        }
        .buttonStyle(.borderedProminent)
      }
    }
    .padding(20)
  }
}

private struct ToastBanner: View {
  let message: String

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: "checkmark.circle.fill")
        .foregroundStyle(SerenityPalette.accent)
      Text(message)
        .font(.callout.weight(.medium))
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 10)
    .background(.ultraThinMaterial, in: Capsule())
    .overlay(
      Capsule()
        .stroke(SerenityPalette.border, lineWidth: 1)
    )
    .shadow(color: .black.opacity(0.18), radius: 8, x: 0, y: 4)
    .transition(.move(edge: .top).combined(with: .opacity))
  }
}
