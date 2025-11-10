[**serenity-notes v0.1.0**](../../README.md)

***

[serenity-notes](../../README.md) / [ThemeTrackingService](../README.md) / ThemeTrackingService

# Class: ThemeTrackingService

Defined in: packages/core/src/services/themeTrackingService.ts:44

Service for extracting and tracking themes from AI insights.

Provides static methods for theme extraction using predefined patterns.
Supports 12 common productivity/wellness themes with regex matching.

## Constructors

### Constructor

> **new ThemeTrackingService**(): `ThemeTrackingService`

#### Returns

`ThemeTrackingService`

## Methods

### extractTheme()

> `static` **extractTheme**(`insight`): [`ThemeExtractionResult`](../interfaces/ThemeExtractionResult.md) \| `null`

Defined in: packages/core/src/services/themeTrackingService.ts:85

Extract theme from a single insight using pattern matching.

Searches the insight's title and description against predefined theme patterns.
Returns the first matching theme or a generic fallback theme.

#### Parameters

##### insight

[`AIInsight`](../../core/src/interfaces/AIInsight.md)

The AI insight to extract theme from

#### Returns

[`ThemeExtractionResult`](../interfaces/ThemeExtractionResult.md) \| `null`

Theme extraction result with name and confidence, or null if no theme found

#### Example

```typescript
const insight = {
  title: 'Procrastination Pattern Detected',
  description: 'You have been delaying tasks...',
  confidence: 0.85
};

const theme = ThemeTrackingService.extractTheme(insight);
// Returns: { themeName: 'procrastination', confidence: 0.85 }
```

***

### extractThemes()

> `static` **extractThemes**(`insights`): `Map`\<`string`, [`ThemeExtractionResult`](../interfaces/ThemeExtractionResult.md)[]\>

Defined in: packages/core/src/services/themeTrackingService.ts:146

Extract themes from multiple insights and group by theme name.

Processes an array of insights and returns a map of theme names to their extraction results.
Useful for analyzing theme frequency and patterns across multiple insights.

#### Parameters

##### insights

[`AIInsight`](../../core/src/interfaces/AIInsight.md)[]

Array of AI insights to process

#### Returns

`Map`\<`string`, [`ThemeExtractionResult`](../interfaces/ThemeExtractionResult.md)[]\>

Map of theme names to arrays of extraction results

#### Example

```typescript
const insights = [
  { title: 'Procrastination detected', confidence: 0.8 },
  { title: 'Burnout warning', confidence: 0.9 },
  { title: 'Delaying tasks again', confidence: 0.75 }
];

const themeMap = ThemeTrackingService.extractThemes(insights);
// Returns:
// Map {
//   'procrastination' => [
//     { themeName: 'procrastination', confidence: 0.8 },
//     { themeName: 'procrastination', confidence: 0.75 }
//   ],
//   'burnout' => [
//     { themeName: 'burnout', confidence: 0.9 }
//   ]
// }
```
