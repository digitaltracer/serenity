[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIGenerateRecapOptions

# Interface: AIGenerateRecapOptions

Defined in: [packages/core/src/types/ipc.ts:292](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L292)

## Properties

### provider

> **provider**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/types/ipc.ts:293](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L293)

***

### type

> **type**: `"weekly"` \| `"monthly"`

Defined in: [packages/core/src/types/ipc.ts:294](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L294)

***

### period

> **period**: `object`

Defined in: [packages/core/src/types/ipc.ts:295](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L295)

#### start

> **start**: `string`

#### end

> **end**: `string`

***

### tasks?

> `optional` **tasks**: [`Task`](Task.md)[]

Defined in: [packages/core/src/types/ipc.ts:299](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L299)

***

### journalEntries?

> `optional` **journalEntries**: [`JournalEntry`](JournalEntry.md)[]

Defined in: [packages/core/src/types/ipc.ts:300](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L300)
