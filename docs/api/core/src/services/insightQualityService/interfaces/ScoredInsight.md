[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/insightQualityService](../README.md) / ScoredInsight

# Interface: ScoredInsight

Defined in: [packages/core/src/services/insightQualityService.ts:19](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L19)

## Extends

- `AIInsight`

## Properties

### qualityScore

> **qualityScore**: [`InsightQualityScore`](InsightQualityScore.md)

Defined in: [packages/core/src/services/insightQualityService.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L20)

***

### similarTo?

> `optional` **similarTo**: `string`[]

Defined in: [packages/core/src/services/insightQualityService.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L21)

***

### supersedes?

> `optional` **supersedes**: `string`

Defined in: [packages/core/src/services/insightQualityService.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L22)

***

### id

> **id**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:19](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L19)

#### Inherited from

`AIInsight.id`

***

### type

> **type**: `"productivity"` \| `"behavior"` \| `"recommendation"` \| `"warning"`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L20)

#### Inherited from

`AIInsight.type`

***

### title

> **title**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L21)

#### Inherited from

`AIInsight.title`

***

### description

> **description**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L22)

#### Inherited from

`AIInsight.description`

***

### confidence

> **confidence**: `number`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L23)

#### Inherited from

`AIInsight.confidence`

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L24)

#### Inherited from

`AIInsight.createdAt`

***

### source

> **source**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L25)

#### Inherited from

`AIInsight.source`

***

### category

> **category**: `"tasks"` \| `"journal"` \| `"habits"` \| `"goals"`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:26](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L26)

#### Inherited from

`AIInsight.category`

***

### actionable?

> `optional` **actionable**: `boolean`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L27)

#### Inherited from

`AIInsight.actionable`

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:28](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L28)

#### Inherited from

`AIInsight.metadata`
