[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / selectGoalFilters

# Function: selectGoalFilters()

> **selectGoalFilters**(`state`): `object`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:240](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L240)

## Parameters

### state

#### goals

[`GoalsState`](../interfaces/GoalsState.md)

## Returns

`object`

### status

> **status**: `"completed"` \| `"active"` \| `"paused"` \| `"failed"` \| `"all"`

### type

> **type**: `"weekly_tasks"` \| `"project_tasks"` \| `"priority_tasks"` \| `"daily_streak"` \| `"journal_weekly"` \| `"completion_rate"` \| `"all"`

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"` \| `"all"`
