[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/aiAssistantService](../README.md) / RecapRequest

# Interface: RecapRequest

Defined in: [packages/core/src/services/aiAssistantService.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L34)

## Properties

### provider

> **provider**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/services/aiAssistantService.ts:35](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L35)

***

### type

> **type**: `"weekly"` \| `"monthly"`

Defined in: [packages/core/src/services/aiAssistantService.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L36)

***

### period

> **period**: `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:37](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L37)

#### start

> **start**: `string`

#### end

> **end**: `string`

***

### tasks

> **tasks**: [`Task`](../../../interfaces/Task.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L41)

***

### journalEntries

> **journalEntries**: [`JournalEntry`](../../../interfaces/JournalEntry.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L42)
