[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIRecap

# Interface: AIRecap

Defined in: [packages/core/src/types/ipc.ts:28](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L28)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types/ipc.ts:29](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L29)

***

### type

> **type**: `"weekly"` \| `"monthly"`

Defined in: [packages/core/src/types/ipc.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L30)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/ipc.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L31)

***

### summary

> **summary**: `string`

Defined in: [packages/core/src/types/ipc.ts:32](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L32)

***

### highlights

> **highlights**: `string`[]

Defined in: [packages/core/src/types/ipc.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L33)

***

### challenges

> **challenges**: `string`[]

Defined in: [packages/core/src/types/ipc.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L34)

***

### recommendations

> **recommendations**: `string`[]

Defined in: [packages/core/src/types/ipc.ts:35](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L35)

***

### period

> **period**: `object`

Defined in: [packages/core/src/types/ipc.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L36)

#### start

> **start**: `string`

#### end

> **end**: `string`

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/types/ipc.ts:40](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L40)

***

### source

> **source**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/types/ipc.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L41)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types/ipc.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L42)
