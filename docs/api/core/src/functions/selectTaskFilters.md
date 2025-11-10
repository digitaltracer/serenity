[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / selectTaskFilters

# Function: selectTaskFilters()

> **selectTaskFilters**(`state`): `object`

Defined in: [packages/core/src/store/slices/tasksSlice.ts:335](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L335)

## Parameters

### state

#### tasks

[`TasksState`](../interfaces/TasksState.md)

## Returns

`object`

### search

> **search**: `string`

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"` \| `"all"`

### status

> **status**: `"completed"` \| `"pending"` \| `"all"`

### project

> **project**: `string` \| `null`
