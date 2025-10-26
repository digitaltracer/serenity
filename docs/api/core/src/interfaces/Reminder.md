[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / Reminder

# Interface: Reminder

Defined in: [packages/core/src/types/index.ts:138](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L138)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/types/index.ts:139](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L139)

***

### goalId?

> `optional` **goalId**: `string`

Defined in: [packages/core/src/types/index.ts:140](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L140)

***

### taskId?

> `optional` **taskId**: `string`

Defined in: [packages/core/src/types/index.ts:141](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L141)

***

### title

> **title**: `string`

Defined in: [packages/core/src/types/index.ts:142](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L142)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types/index.ts:143](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L143)

***

### reminderDate

> **reminderDate**: `Date`

Defined in: [packages/core/src/types/index.ts:144](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L144)

***

### type

> **type**: `"custom"` \| `"goal_check"` \| `"task_due"` \| `"habit_reminder"`

Defined in: [packages/core/src/types/index.ts:145](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L145)

***

### status

> **status**: `"dismissed"` \| `"pending"` \| `"sent"` \| `"snoozed"`

Defined in: [packages/core/src/types/index.ts:146](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L146)

***

### repeatPattern?

> `optional` **repeatPattern**: `object`

Defined in: [packages/core/src/types/index.ts:147](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L147)

#### type

> **type**: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`

#### interval

> **interval**: `number`

#### endDate?

> `optional` **endDate**: `Date`

***

### notificationSettings

> **notificationSettings**: `object`

Defined in: [packages/core/src/types/index.ts:152](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L152)

#### enabled

> **enabled**: `boolean`

#### sound

> **sound**: `boolean`

#### popup

> **popup**: `boolean`

#### beforeMinutes

> **beforeMinutes**: `number`

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/types/index.ts:158](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L158)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/types/index.ts:159](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L159)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/core/src/types/index.ts:160](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/index.ts#L160)
