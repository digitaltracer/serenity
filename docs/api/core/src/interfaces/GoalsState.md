[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / GoalsState

# Interface: GoalsState

Defined in: [packages/core/src/store/slices/goalsSlice.ts:5](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L5)

## Properties

### goals

> **goals**: [`Goal`](Goal.md)[]

Defined in: [packages/core/src/store/slices/goalsSlice.ts:6](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L6)

***

### reminders

> **reminders**: [`Reminder`](Reminder.md)[]

Defined in: [packages/core/src/store/slices/goalsSlice.ts:7](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L7)

***

### selectedGoalId

> **selectedGoalId**: `string` \| `null`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:8](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L8)

***

### isGoalModalOpen

> **isGoalModalOpen**: `boolean`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L9)

***

### isReminderModalOpen

> **isReminderModalOpen**: `boolean`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L10)

***

### goalFilters

> **goalFilters**: `object`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L11)

#### status

> **status**: `"completed"` \| `"active"` \| `"paused"` \| `"failed"` \| `"all"`

#### type

> **type**: `"weekly_tasks"` \| `"project_tasks"` \| `"priority_tasks"` \| `"daily_streak"` \| `"journal_weekly"` \| `"completion_rate"` \| `"all"`

#### priority

> **priority**: `"low"` \| `"medium"` \| `"high"` \| `"all"`

***

### loading

> **loading**: `boolean`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L16)

***

### error

> **error**: `string` \| `null`

Defined in: [packages/core/src/store/slices/goalsSlice.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/goalsSlice.ts#L17)
