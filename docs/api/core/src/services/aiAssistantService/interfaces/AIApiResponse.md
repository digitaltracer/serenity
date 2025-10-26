[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/aiAssistantService](../README.md) / AIApiResponse

# Interface: AIApiResponse\<T\>

Defined in: [packages/core/src/services/aiAssistantService.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L11)

## Type Parameters

### T

`T` = `unknown`

## Properties

### success

> **success**: `boolean`

Defined in: [packages/core/src/services/aiAssistantService.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L12)

***

### data?

> `optional` **data**: `T`

Defined in: [packages/core/src/services/aiAssistantService.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L13)

***

### error?

> `optional` **error**: `string`

Defined in: [packages/core/src/services/aiAssistantService.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L14)

***

### usage?

> `optional` **usage**: `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L15)

#### promptTokens

> **promptTokens**: `number`

#### completionTokens

> **completionTokens**: `number`

#### totalTokens

> **totalTokens**: `number`
