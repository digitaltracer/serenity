[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIInsightEnhanced

# Interface: AIInsightEnhanced

Defined in: [packages/core/src/store/slices/insightsSlice.ts:7](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L7)

Enhanced AI Insight interface with feedback fields

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:8](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L8)

***

### type

> **type**: `"productivity"` \| `"behavior"` \| `"recommendation"` \| `"warning"`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L9)

***

### title

> **title**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L10)

***

### description

> **description**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L11)

***

### confidence

> **confidence**: `number`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L12)

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L13)

***

### updatedAt?

> `optional` **updatedAt**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L14)

***

### source

> **source**: `"openai"` \| `"gemini"` \| `"anthropic"` \| `"local"`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L15)

***

### category

> **category**: `"tasks"` \| `"journal"` \| `"habits"` \| `"goals"`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L16)

***

### actionable?

> `optional` **actionable**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L17)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L18)

#### Index Signature

\[`key`: `string`\]: `unknown`

#### sourceIds?

> `optional` **sourceIds**: `string`[]

#### tags?

> `optional` **tags**: `string`[]

#### priority?

> `optional` **priority**: `"low"` \| `"medium"` \| `"high"`

***

### visualizationData?

> `optional` **visualizationData**: `number`[]

Defined in: [packages/core/src/store/slices/insightsSlice.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L24)

***

### actionabilitySuggestions?

> `optional` **actionabilitySuggestions**: `object`[]

Defined in: [packages/core/src/store/slices/insightsSlice.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L25)

#### action

> **action**: `string`

#### description

> **description**: `string`

#### type

> **type**: `"task"` \| `"goal"` \| `"habit"`

***

### userRating?

> `optional` **userRating**: `number`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L31)

***

### dismissed?

> `optional` **dismissed**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:32](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L32)

***

### markedHelpful?

> `optional` **markedHelpful**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L33)

***

### userNotes?

> `optional` **userNotes**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L34)
