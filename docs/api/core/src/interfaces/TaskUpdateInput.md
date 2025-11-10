[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / TaskUpdateInput

# Interface: TaskUpdateInput

Defined in: [packages/core/src/types/ipc.ts:101](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L101)

## Properties

### title?

> `optional` **title**: `string`

Defined in: [packages/core/src/types/ipc.ts:102](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L102)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types/ipc.ts:103](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L103)

***

### completed?

> `optional` **completed**: `boolean`

Defined in: [packages/core/src/types/ipc.ts:104](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L104)

***

### completedAt?

> `optional` **completedAt**: `Date`

Defined in: [packages/core/src/types/ipc.ts:105](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L105)

***

### priority?

> `optional` **priority**: `"low"` \| `"medium"` \| `"high"`

Defined in: [packages/core/src/types/ipc.ts:106](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L106)

***

### dueDate?

> `optional` **dueDate**: `Date`

Defined in: [packages/core/src/types/ipc.ts:107](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L107)

***

### projectId?

> `optional` **projectId**: `string`

Defined in: [packages/core/src/types/ipc.ts:108](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L108)

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/types/ipc.ts:109](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L109)

***

### updatedAt?

> `optional` **updatedAt**: `Date`

Defined in: [packages/core/src/types/ipc.ts:110](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L110)

***

### subtasks?

> `optional` **subtasks**: `object`[]

Defined in: [packages/core/src/types/ipc.ts:111](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L111)

#### id

> **id**: `string`

#### title

> **title**: `string`

#### completed

> **completed**: `boolean`

#### order

> **order**: `number`
