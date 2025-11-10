[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / Goal

# Interface: Goal

Defined in: [packages/core/src/types/index.ts:102](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L102)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types/index.ts:103](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L103)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/index.ts:104](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L104)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types/index.ts:105](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L105)

***

### type

> **type**: `"weekly_tasks"` \| `"project_tasks"` \| `"priority_tasks"` \| `"daily_streak"` \| `"journal_weekly"` \| `"completion_rate"`

Defined in: [packages/core/src/types/index.ts:108](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L108)

***

### config

> **config**: `object`

Defined in: [packages/core/src/types/index.ts:111](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L111)

#### targetCount?

> `optional` **targetCount**: `number`

#### projectId?

> `optional` **projectId**: `string`

#### priority?

> `optional` **priority**: `"low"` \| `"medium"` \| `"high"`

#### streakDays?

> `optional` **streakDays**: `number`

#### targetRate?

> `optional` **targetRate**: `number`

#### timeframe

> **timeframe**: `"daily"` \| `"weekly"` \| `"monthly"`

***

### progress

> **progress**: `object`

Defined in: [packages/core/src/types/index.ts:121](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L121)

#### current

> **current**: `number`

#### target

> **target**: `number`

#### percentage

> **percentage**: `number`

#### isCompleted

> **isCompleted**: `boolean`

#### periodStart

> **periodStart**: `Date`

#### periodEnd

> **periodEnd**: `Date`

***

### status

> **status**: `"completed"` \| `"active"` \| `"paused"` \| `"failed"`

Defined in: [packages/core/src/types/index.ts:130](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L130)

***

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"`

Defined in: [packages/core/src/types/index.ts:131](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L131)

***

### reminders

> **reminders**: [`Reminder`](Reminder.md)[]

Defined in: [packages/core/src/types/index.ts:132](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L132)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/types/index.ts:133](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L133)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/types/index.ts:134](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L134)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/core/src/types/index.ts:135](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L135)
