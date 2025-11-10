[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / selectAIConfiguration

# Function: selectAIConfiguration()

> **selectAIConfiguration**(`state`): `object`

Defined in: [packages/core/src/store/slices/aiAssistantSlice.ts:598](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/aiAssistantSlice.ts#L598)

## Parameters

### state

#### aiAssistant

[`AIAssistantState`](../interfaces/AIAssistantState.md)

## Returns

`object`

### autoAnalyze

> **autoAnalyze**: `boolean` = `state.aiAssistant.autoAnalyze`

### analysisFrequency

> **analysisFrequency**: `"daily"` \| `"weekly"` \| `"manual"` = `state.aiAssistant.analysisFrequency`

### dataTypes

> **dataTypes**: `object` = `state.aiAssistant.dataTypes`

#### dataTypes.includeTasks

> **includeTasks**: `boolean`

#### dataTypes.includeJournal

> **includeJournal**: `boolean`

#### dataTypes.includeProjects

> **includeProjects**: `boolean`
