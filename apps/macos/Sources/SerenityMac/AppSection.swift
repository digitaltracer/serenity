import Foundation

public enum AppSection: String, CaseIterable, Identifiable {
  case home
  case actionHub
  case today
  case journal
  case goals
  case projects
  case integrations
  case insights
  case database
  case settings

  public var id: String { rawValue }

  var title: String {
    switch self {
    case .home:
      return "Home"
    case .actionHub:
      return "ActionHub"
    case .today:
      return "Today"
    case .journal:
      return "Journal"
    case .goals:
      return "Goals"
    case .projects:
      return "Projects"
    case .integrations:
      return "Integrations"
    case .insights:
      return "Insights"
    case .database:
      return "Database"
    case .settings:
      return "Settings"
    }
  }

  var systemImage: String {
    switch self {
    case .home:
      return "house"
    case .actionHub:
      return "checklist"
    case .today:
      return "sun.max"
    case .journal:
      return "book"
    case .goals:
      return "target"
    case .projects:
      return "folder"
    case .integrations:
      return "link"
    case .insights:
      return "chart.bar.xaxis"
    case .database:
      return "internaldrive"
    case .settings:
      return "gearshape"
    }
  }
}
