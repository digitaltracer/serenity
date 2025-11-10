[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / ActionabilitySuggestion

# Interface: ActionabilitySuggestion

Defined in: [packages/core/src/services/actionabilityService.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L11)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L12)

***

### action

> **action**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L13)

***

### description

> **description**: `string`

Defined in: [packages/core/src/services/actionabilityService.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L14)

***

### type

> **type**: `"task"` \| `"goal"` \| `"habit"` \| `"journal_prompt"`

Defined in: [packages/core/src/services/actionabilityService.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L15)

***

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"`

Defined in: [packages/core/src/services/actionabilityService.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L16)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [packages/core/src/services/actionabilityService.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L17)

#### suggestedTitle?

> `optional` **suggestedTitle**: `string`

#### suggestedDescription?

> `optional` **suggestedDescription**: `string`

#### suggestedTags?

> `optional` **suggestedTags**: `string`[]

#### suggestedDueDate?

> `optional` **suggestedDueDate**: `string`

#### suggestedTargetValue?

> `optional` **suggestedTargetValue**: `number`

#### suggestedTargetUnit?

> `optional` **suggestedTargetUnit**: `string`
