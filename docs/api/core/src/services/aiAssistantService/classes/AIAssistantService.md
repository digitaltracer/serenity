[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/aiAssistantService](../README.md) / AIAssistantService

# Class: AIAssistantService

Defined in: [packages/core/src/services/aiAssistantService.ts:83](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L83)

## Constructors

### Constructor

> **new AIAssistantService**(): `AIAssistantService`

#### Returns

`AIAssistantService`

## Methods

### generateGoalSuggestions()

> `static` **generateGoalSuggestions**(`data`): [`GoalSuggestion`](../interfaces/GoalSuggestion.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:87](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L87)

Generate goal suggestions based on user activity patterns

#### Parameters

##### data

###### tasks

[`Task`](../../../interfaces/Task.md)[]

###### journalEntries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

###### existingGoals?

`any`[]

#### Returns

[`GoalSuggestion`](../interfaces/GoalSuggestion.md)[]

***

### preprocessTasks()

> `static` **preprocessTasks**(`tasks`): [`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:184](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L184)

Preprocess tasks for AI analysis
Removes sensitive information and structures data

#### Parameters

##### tasks

[`Task`](../../../interfaces/Task.md)[]

#### Returns

[`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

***

### generateLocalInsights()

> `static` **generateLocalInsights**(`tasks`, `journalEntries`): `object`[]

Defined in: [packages/core/src/services/aiAssistantService.ts:209](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L209)

Generate basic, local insights without calling external providers.
Provides a sensible fallback when no provider is configured.

#### Parameters

##### tasks

[`Task`](../../../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

#### Returns

`object`[]

***

### preprocessJournalEntries()

> `static` **preprocessJournalEntries**(`entries`): [`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

Defined in: [packages/core/src/services/aiAssistantService.ts:315](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L315)

Preprocess journal entries for AI analysis
Removes sensitive information and structures data

#### Parameters

##### entries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

#### Returns

[`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

***

### generateInsightPrompts()

> `static` **generateInsightPrompts**(`data`): `Record`\<`string`, `string`\>

Defined in: [packages/core/src/services/aiAssistantService.ts:334](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L334)

Generate prompts for behavioral analysis

#### Parameters

##### data

###### tasks

[`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

###### journalEntries

[`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

###### dataTypes

`string`[]

#### Returns

`Record`\<`string`, `string`\>

***

### generateRecapPrompts()

> `static` **generateRecapPrompts**(`data`): `string`

Defined in: [packages/core/src/services/aiAssistantService.ts:415](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L415)

Generate prompts for recap generation

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

[`PreprocessedTask`](../interfaces/PreprocessedTask.md)[]

###### journalEntries

[`PreprocessedJournalEntry`](../interfaces/PreprocessedJournalEntry.md)[]

#### Returns

`string`

***

### filterUnanalyzedData()

> `static` **filterUnanalyzedData**(`tasks`, `journalEntries`, `analysisTracker`): `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:460](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L460)

Filter new data that hasn't been analyzed yet

#### Parameters

##### tasks

[`Task`](../../../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

##### analysisTracker

###### processedTaskIds

`string`[]

###### processedJournalIds

`string`[]

###### lastTaskAnalysis?

`string`

###### lastJournalAnalysis?

`string`

#### Returns

`object`

##### newTasks

> **newTasks**: [`Task`](../../../interfaces/Task.md)[]

##### newJournalEntries

> **newJournalEntries**: [`JournalEntry`](../../../interfaces/JournalEntry.md)[]

***

### createAnalysisSummary()

> `static` **createAnalysisSummary**(`analyzedTasks`, `analyzedJournalEntries`): `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:531](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L531)

Create analysis summary for tracking

#### Parameters

##### analyzedTasks

[`Task`](../../../interfaces/Task.md)[]

##### analyzedJournalEntries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

#### Returns

`object`

##### processedTaskIds

> **processedTaskIds**: `string`[]

##### processedJournalIds

> **processedJournalIds**: `string`[]

##### lastTaskAnalysis?

> `optional` **lastTaskAnalysis**: `string`

##### lastJournalAnalysis?

> `optional` **lastJournalAnalysis**: `string`

##### totalTasksAnalyzed

> **totalTasksAnalyzed**: `number`

##### totalJournalEntriesAnalyzed

> **totalJournalEntriesAnalyzed**: `number`

***

### parseInsightsResponse()

> `static` **parseInsightsResponse**(`response`): `AIInsight`[]

Defined in: [packages/core/src/services/aiAssistantService.ts:557](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L557)

Parse AI response and extract insights

#### Parameters

##### response

`string`

#### Returns

`AIInsight`[]

***

### parseRecapResponse()

> `static` **parseRecapResponse**(`response`, `type`, `period`): `AIRecap` \| `null`

Defined in: [packages/core/src/services/aiAssistantService.ts:635](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L635)

Parse AI response and extract recap

#### Parameters

##### response

`string`

##### type

`"weekly"` | `"monthly"`

##### period

###### start

`string`

###### end

`string`

#### Returns

`AIRecap` \| `null`

***

### validateApiKeyFormat()

> `static` **validateApiKeyFormat**(`provider`, `apiKey`): `boolean`

Defined in: [packages/core/src/services/aiAssistantService.ts:661](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L661)

Validate API key format

#### Parameters

##### provider

`"openai"` | `"gemini"` | `"anthropic"`

##### apiKey

`string`

#### Returns

`boolean`

***

### estimateTokenUsage()

> `static` **estimateTokenUsage**(`tasks`, `journalEntries`): `number`

Defined in: [packages/core/src/services/aiAssistantService.ts:681](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L681)

Estimate token usage for analysis

#### Parameters

##### tasks

[`Task`](../../../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../../../interfaces/JournalEntry.md)[]

#### Returns

`number`

***

### getProviderConfig()

> `static` **getProviderConfig**(`provider`): \{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \} \| \{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \} \| \{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \}

Defined in: [packages/core/src/services/aiAssistantService.ts:698](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L698)

Get provider-specific configuration

#### Parameters

##### provider

`"openai"` | `"gemini"` | `"anthropic"`

#### Returns

\{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \} \| \{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \} \| \{ `name`: `string`; `model`: `string`; `maxTokens`: `number`; `apiEndpoint`: `string`; `keyPrefix`: `string`; \}

***

### generateAnalysisSummary()

> `static` **generateAnalysisSummary**(`params`): `object`

Defined in: [packages/core/src/services/aiAssistantService.ts:730](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L730)

Generate an analysis summary from insights for context continuity
This summary will be used in future analyses to track longitudinal patterns

#### Parameters

##### params

###### insights

`AIInsight`[]

###### tasksAnalyzed

`number`

###### journalsAnalyzed

`number`

###### userProfile?

\{ `focusAreas`: `string`[]; `activeGoals`: `object`[]; `commonTags`: `object`[]; \}

###### userProfile.focusAreas

`string`[]

###### userProfile.activeGoals

`object`[]

###### userProfile.commonTags

`object`[]

#### Returns

`object`

##### summary\_text

> **summary\_text**: `string`

##### key\_themes

> **key\_themes**: `string`[]

##### tracked\_patterns

> **tracked\_patterns**: `object`[]

##### user\_focus\_areas

> **user\_focus\_areas**: `string`[]

##### tasks\_analyzed

> **tasks\_analyzed**: `number`

##### journals\_analyzed

> **journals\_analyzed**: `number`

##### insights\_generated

> **insights\_generated**: `number`

***

### applyQualityScoring()

> `static` **applyQualityScoring**(`rawInsights`, `context?`): `AIInsight`[]

Defined in: [packages/core/src/services/aiAssistantService.ts:851](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/aiAssistantService.ts#L851)

Apply quality scoring, filtering, deduplication, and ranking to insights
This is the integration point for InsightQualityService

#### Parameters

##### rawInsights

`AIInsight`[]

##### context?

###### previousInsights?

`AIInsight`[]

###### focusAreas?

`string`[]

###### recentCategories?

`string`[]

###### minimumQuality?

`number`

#### Returns

`AIInsight`[]
