import SwiftUI
import AppKit

enum SerenityUI {
  private static func dynamicColor(
    light: (CGFloat, CGFloat, CGFloat, CGFloat),
    dark: (CGFloat, CGFloat, CGFloat, CGFloat)
  ) -> Color {
    Color(nsColor: NSColor(name: nil) { appearance in
      let bestMatch = appearance.bestMatch(from: [.darkAqua, .vibrantDark, .aqua, .vibrantLight])
      let active = (bestMatch == .darkAqua || bestMatch == .vibrantDark) ? dark : light
      return NSColor(
        srgbRed: active.0,
        green: active.1,
        blue: active.2,
        alpha: active.3
      )
    })
  }

  enum Palette {
    static let accent = Color(red: 0.27, green: 0.52, blue: 0.95)
    static let windowBackground = SerenityUI.dynamicColor(
      light: (0.95, 0.97, 1.00, 1.0),
      dark: (0.02, 0.07, 0.18, 1.0)
    )
    static let sidebarBackground = SerenityUI.dynamicColor(
      light: (0.93, 0.95, 0.99, 1.0),
      dark: (0.03, 0.07, 0.16, 1.0)
    )
    static let sidebarHeaderBackground = SerenityUI.dynamicColor(
      light: (0.95, 0.97, 1.00, 1.0),
      dark: (0.03, 0.08, 0.18, 1.0)
    )
    static let panelBackground = SerenityUI.dynamicColor(
      light: (0.98, 0.99, 1.00, 1.0),
      dark: (0.04, 0.09, 0.20, 1.0)
    )
    static let panelBackgroundRaised = SerenityUI.dynamicColor(
      light: (0.94, 0.96, 0.99, 1.0),
      dark: (0.07, 0.13, 0.25, 1.0)
    )
    static let innerCardBackground = SerenityUI.dynamicColor(
      light: (0.90, 0.94, 0.98, 1.0),
      dark: (0.08, 0.14, 0.25, 1.0)
    )
    static let border = SerenityUI.dynamicColor(
      light: (0.62, 0.70, 0.82, 0.45),
      dark: (0.24, 0.34, 0.50, 0.55)
    )
    static let thinBorder = SerenityUI.dynamicColor(
      light: (0.62, 0.70, 0.82, 0.24),
      dark: (0.24, 0.34, 0.50, 0.32)
    )
    static let activeItemBackground = SerenityUI.dynamicColor(
      light: (0.79, 0.86, 0.97, 1.0),
      dark: (0.17, 0.25, 0.38, 1.0)
    )
    static let headerIconBackground = SerenityUI.dynamicColor(
      light: (0.86, 0.91, 0.98, 1.0),
      dark: (0.10, 0.17, 0.30, 1.0)
    )
    static let textSecondary = SerenityUI.dynamicColor(
      light: (0.31, 0.39, 0.51, 1.0),
      dark: (0.57, 0.65, 0.78, 1.0)
    )
  }

  enum Typography {
    static let pageTitle = Font.system(size: 28, weight: .semibold)
    static let pageSubtitle = Font.system(size: 17, weight: .regular)
    static let sectionTitle = Font.system(size: 19, weight: .semibold)
    static let cardTitle = Font.system(size: 22, weight: .semibold)
    static let bodyLarge = Font.system(size: 16, weight: .regular)
    static let body = Font.system(size: 15, weight: .regular)
    static let bodyMedium = Font.system(size: 14, weight: .medium)
    static let caption = Font.system(size: 11, weight: .medium)
  }
}

typealias SerenityPalette = SerenityUI.Palette
typealias SerenityType = SerenityUI.Typography

struct SerenityPrimaryButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(SerenityType.bodyMedium)
      .padding(.horizontal, 12)
      .padding(.vertical, 7)
      .foregroundStyle(Color.white)
      .background(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .fill(SerenityPalette.accent.opacity(configuration.isPressed ? 0.78 : 1))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .stroke(SerenityPalette.accent.opacity(0.65), lineWidth: 1)
      )
      .scaleEffect(configuration.isPressed ? 0.99 : 1)
      .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
  }
}

struct SerenitySecondaryButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(SerenityType.bodyMedium)
      .padding(.horizontal, 12)
      .padding(.vertical, 7)
      .foregroundStyle(Color.white.opacity(0.92))
      .background(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .fill(SerenityPalette.panelBackgroundRaised.opacity(configuration.isPressed ? 0.72 : 1))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .stroke(SerenityPalette.thinBorder, lineWidth: 1)
      )
      .scaleEffect(configuration.isPressed ? 0.99 : 1)
      .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
  }
}

struct SerenityPillButtonStyle: ButtonStyle {
  let selected: Bool

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(SerenityType.bodyMedium)
      .padding(.horizontal, 16)
      .padding(.vertical, 8)
      .foregroundStyle(selected ? Color.white : SerenityPalette.textSecondary)
      .background(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .fill(selected ? SerenityPalette.activeItemBackground.opacity(configuration.isPressed ? 0.72 : 1) : SerenityPalette.panelBackgroundRaised.opacity(configuration.isPressed ? 0.75 : 1))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 12, style: .continuous)
          .stroke(selected ? SerenityPalette.border : SerenityPalette.thinBorder, lineWidth: 1)
      )
      .scaleEffect(configuration.isPressed ? 0.99 : 1)
      .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
  }
}

struct SerenityInputFieldModifier: ViewModifier {
  func body(content: Content) -> some View {
    content
      .font(SerenityType.body)
      .padding(.horizontal, 10)
      .padding(.vertical, 8)
      .background(SerenityPalette.panelBackgroundRaised, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .stroke(SerenityPalette.thinBorder, lineWidth: 1)
      )
  }
}

extension View {
  func serenityInputField() -> some View {
    modifier(SerenityInputFieldModifier())
  }

  func serenityPanel(cornerRadius: CGFloat = 16) -> some View {
    background(SerenityPalette.panelBackground, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
      .overlay(
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
          .stroke(SerenityPalette.border, lineWidth: 1)
      )
  }
}
