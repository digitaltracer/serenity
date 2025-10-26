[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIAssistantState

# Interface: AIAssistantState

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:68](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L68)

## Properties

### providers

> **providers**: [`AIProvider`](AIProvider.md)[]

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:70](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L70)

***

### activeProvider?

> `optional` **activeProvider**: `"openai"` \| `"gemini"` \| `"anthropic"`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:71](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L71)

***

### isAnalyzing

> **isAnalyzing**: `boolean`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:74](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L74)

***

### analysisProgress

> **analysisProgress**: `number`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:75](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L75)

***

### analysisStatus

> **analysisStatus**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:76](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L76)

***

### lastAnalysis?

> `optional` **lastAnalysis**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:77](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L77)

***

### insights

> **insights**: `AIInsight`[]

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:80](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L80)

***

### recaps

> **recaps**: `AIRecap`[]

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:81](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L81)

***

### analysisTracker

> **analysisTracker**: [`AnalysisTracker`](AnalysisTracker.md)

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:84](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L84)

***

### autoAnalyze

> **autoAnalyze**: `boolean`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:87](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L87)

***

### analysisFrequency

> **analysisFrequency**: `"daily"` \| `"weekly"` \| `"manual"`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:88](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L88)

***

### dataTypes

> **dataTypes**: `object`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:89](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L89)

#### includeTasks

> **includeTasks**: `boolean`

#### includeJournal

> **includeJournal**: `boolean`

#### includeProjects

> **includeProjects**: `boolean`

***

### lastError?

> `optional` **lastError**: `string`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:96](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L96)

***

### errors

> **errors**: `string`[]

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:97](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L97)

***

### usage

> **usage**: [`AIUsageEntry`](AIUsageEntry.md)[]

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:98](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L98)
