[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/promptEngineeringService](../README.md) / PromptContext

# Interface: PromptContext

Defined in: [packages/core/src/services/promptEngineeringService.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L10)

## Properties

### userGoals?

> `optional` **userGoals**: [`Goal`](../../../interfaces/Goal.md)[]

Defined in: [packages/core/src/services/promptEngineeringService.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L11)

***

### focusAreas?

> `optional` **focusAreas**: `string`[]

Defined in: [packages/core/src/services/promptEngineeringService.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L12)

***

### workStyle?

> `optional` **workStyle**: `"sprinter"` \| `"marathon"` \| `"balanced"`

Defined in: [packages/core/src/services/promptEngineeringService.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L13)

***

### previousInsights?

> `optional` **previousInsights**: `object`[]

Defined in: [packages/core/src/services/promptEngineeringService.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L14)

#### type

> **type**: `string`

#### title

> **title**: `string`

***

### previousAnalyses?

> `optional` **previousAnalyses**: `object`[]

Defined in: [packages/core/src/services/promptEngineeringService.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L15)

#### created\_at

> **created\_at**: `string`

#### summary\_text

> **summary\_text**: `string`

#### key\_themes

> **key\_themes**: `string`

#### tracked\_patterns

> **tracked\_patterns**: `string`

***

### currentPriorities?

> `optional` **currentPriorities**: `string`[]

Defined in: [packages/core/src/services/promptEngineeringService.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L21)

***

### timeframe?

> `optional` **timeframe**: `string`

Defined in: [packages/core/src/services/promptEngineeringService.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L22)

***

### userPreferences?

> `optional` **userPreferences**: `object`

Defined in: [packages/core/src/services/promptEngineeringService.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L23)

#### communicationStyle

> **communicationStyle**: `"detailed"` \| `"concise"`

#### preferredCategories

> **preferredCategories**: `string`[]
