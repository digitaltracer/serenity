[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/promptEngineeringService](../README.md) / PromptEngineeringService

# Class: PromptEngineeringService

Defined in: [packages/core/src/services/promptEngineeringService.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L34)

## Constructors

### Constructor

> **new PromptEngineeringService**(): `PromptEngineeringService`

#### Returns

`PromptEngineeringService`

## Methods

### generateInsightPrompt()

> `static` **generateInsightPrompt**(`data`): `string`

Defined in: [packages/core/src/services/promptEngineeringService.ts:286](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L286)

Generate comprehensive analysis prompt for tasks and journal

#### Parameters

##### data

###### tasks

[`PreprocessedTask`](../../aiPreprocessingService/interfaces/PreprocessedTask.md)[]

###### journalEntries

[`PreprocessedJournalEntry`](../../aiPreprocessingService/interfaces/PreprocessedJournalEntry.md)[]

###### dataTypes

`string`[]

###### context?

[`PromptContext`](../interfaces/PromptContext.md)

###### dataSummary?

`string`

#### Returns

`string`

***

### generateRecapPrompt()

> `static` **generateRecapPrompt**(`data`): `string`

Defined in: [packages/core/src/services/promptEngineeringService.ts:361](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L361)

Generate recap prompt with enhanced context

#### Parameters

##### data

###### type

`"weekly"` \| `"monthly"`

###### period

\{ `start`: `string`; `end`: `string`; \}

###### period.start

`string`

###### period.end

`string`

###### tasks

[`PreprocessedTask`](../../aiPreprocessingService/interfaces/PreprocessedTask.md)[]

###### journalEntries

[`PreprocessedJournalEntry`](../../aiPreprocessingService/interfaces/PreprocessedJournalEntry.md)[]

###### context?

[`PromptContext`](../interfaces/PromptContext.md)

###### dataSummary?

`string`

#### Returns

`string`

***

### optimizePromptTokens()

> `static` **optimizePromptTokens**(`prompt`, `maxTokens`): `string`

Defined in: [packages/core/src/services/promptEngineeringService.ts:465](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L465)

Optimize prompt for token efficiency

#### Parameters

##### prompt

`string`

##### maxTokens

`number`

#### Returns

`string`

***

### generateTargetedPrompt()

> `static` **generateTargetedPrompt**(`type`, `data`): `string`

Defined in: [packages/core/src/services/promptEngineeringService.ts:490](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/promptEngineeringService.ts#L490)

Generate targeted prompt for specific insight type

#### Parameters

##### type

`"productivity"` | `"habits"` | `"goals"` | `"wellbeing"`

##### data

###### tasks

[`PreprocessedTask`](../../aiPreprocessingService/interfaces/PreprocessedTask.md)[]

###### journalEntries

[`PreprocessedJournalEntry`](../../aiPreprocessingService/interfaces/PreprocessedJournalEntry.md)[]

###### context?

[`PromptContext`](../interfaces/PromptContext.md)

#### Returns

`string`
