[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIInsightForActionability

# Interface: AIInsightForActionability

Defined in: [packages/core/src/services/actionabilityService.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L27)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:28](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L28)

***

### type

> **type**: `"productivity"` \| `"behavior"` \| `"recommendation"` \| `"warning"`

Defined in: [packages/core/src/services/actionabilityService.ts:29](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L29)

***

### title

> **title**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L30)

***

### description

> **description**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L31)

***

### category

> **category**: `"tasks"` \| `"journal"` \| `"habits"` \| `"goals"`

Defined in: [packages/core/src/services/actionabilityService.ts:32](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L32)

***

### actionable?

> `optional` **actionable**: `boolean`

Defined in: [packages/core/src/services/actionabilityService.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L33)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [packages/core/src/services/actionabilityService.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L34)

#### Index Signature

\[`key`: `string`\]: `any`

#### sourceIds?

> `optional` **sourceIds**: `string`[]

#### tags?

> `optional` **tags**: `string`[]

#### priority?

> `optional` **priority**: `"low"` \| `"medium"` \| `"high"`
