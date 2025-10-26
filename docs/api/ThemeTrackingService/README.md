[**serenity-notes v0.1.0**](../README.md)

***

[serenity-notes](../README.md) / ThemeTrackingService

# ThemeTrackingService

Theme Tracking Service

Extracts themes from AI insights and tracks recurring patterns over time.
Uses regex-based pattern matching to identify 12 predefined themes from insight text.

## Example

```typescript
import { ThemeTrackingService } from '@serenity/core';

// Extract theme from an insight
const theme = ThemeTrackingService.extractTheme(insight);
if (theme) {
  console.log(`Theme: ${theme.themeName}, Confidence: ${theme.confidence}`);
}

// Extract themes from multiple insights
const themeMap = ThemeTrackingService.extractThemes(insights);
```

## Classes

- [ThemeTrackingService](classes/ThemeTrackingService.md)

## Interfaces

- [ThemeExtractionResult](interfaces/ThemeExtractionResult.md)
