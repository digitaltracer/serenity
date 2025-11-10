[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIInsight

# Interface: AIInsight

Defined in: [packages/core/src/types/ipc.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L15)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types/ipc.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L16)

***

### type

> **type**: `"productivity"` \| `"behavior"` \| `"recommendation"` \| `"warning"`

Defined in: [packages/core/src/types/ipc.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L17)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/ipc.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L18)

***

### description

> **description**: `string`

Defined in: [packages/core/src/types/ipc.ts:19](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L19)

***

### confidence

> **confidence**: `number`

Defined in: [packages/core/src/types/ipc.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L20)

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/types/ipc.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L21)

***

### source

> **source**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/types/ipc.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L22)

***

### category

> **category**: `"tasks"` \| `"journal"` \| `"habits"` \| `"goals"`

Defined in: [packages/core/src/types/ipc.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L23)

***

### actionable?

> `optional` **actionable**: `boolean`

Defined in: [packages/core/src/types/ipc.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L24)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types/ipc.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L25)
