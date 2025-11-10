[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/aiAssistantService](../README.md) / AnalysisRequest

# Interface: AnalysisRequest

Defined in: [packages/core/src/services/aiAssistantService.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L22)

## Properties

### provider

> **provider**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/services/aiAssistantService.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L23)

***

### tasks

> **tasks**: [`Task`](../../../interfaces/Task.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L24)

***

### journalEntries

> **journalEntries**: [`JournalEntry`](../../../interfaces/JournalEntry.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L25)

***

### dataTypes

> **dataTypes**: `string`[]

Defined in: [packages/core/src/services/aiAssistantService.ts:26](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L26)

***

### analysisType

> **analysisType**: `"insights"` \| `"recap"`

Defined in: [packages/core/src/services/aiAssistantService.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L27)

***

### timeframe?

> `optional` **timeframe**: `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:28](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L28)

#### start

> **start**: `Date`

#### end

> **end**: `Date`
