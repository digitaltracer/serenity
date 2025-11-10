[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/aiPreprocessingService](../README.md) / AIPreprocessingService

# Class: AIPreprocessingService

Defined in: [packages/core/src/services/aiPreprocessingService.ts:64](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiPreprocessingService.ts#L64)

## Constructors

### Constructor

> **new AIPreprocessingService**(): `AIPreprocessingService`

#### Returns

`AIPreprocessingService`

## Methods

### preprocessTasks()

> `static` **preprocessTasks**(`tasks`, `config`): [`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

Defined in: [packages/core/src/services/aiPreprocessingService.ts:348](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiPreprocessingService.ts#L348)

Preprocess tasks with enhanced intelligence

#### Parameters

##### tasks

[`Task`](../../../interfaces/Task.md)[]

##### config

`Partial`\<[`PreprocessingConfig`](../interfaces/PreprocessingConfig.md)\> = `{}`

#### Returns

[`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

***

### preprocessJournalEntries()

> `static` **preprocessJournalEntries**(`entries`, `config`): [`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

Defined in: [packages/core/src/services/aiPreprocessingService.ts:415](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiPreprocessingService.ts#L415)

Preprocess journal entries with enhanced intelligence

#### Parameters

##### entries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

##### config

`Partial`\<[`PreprocessingConfig`](../interfaces/PreprocessingConfig.md)\> = `{}`

#### Returns

[`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

***

### prepareDataSummary()

> `static` **prepareDataSummary**(`preprocessedTasks`, `preprocessedEntries`): `string`

Defined in: [packages/core/src/services/aiPreprocessingService.ts:467](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiPreprocessingService.ts#L467)

Prepare data summary for prompt context

#### Parameters

##### preprocessedTasks

[`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

##### preprocessedEntries

[`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

#### Returns

`string`
