[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / validateTask

# Function: validateTask()

> **validateTask**(`data`): `object`

Defined in: [packages/core/src/validation/schemas.ts:119](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L119)

## Parameters

### data

`unknown`

## Returns

`object`

### id

> **id**: `string`

### title

> **title**: `string`

### description?

> `optional` **description**: `string`

### completed

> **completed**: `boolean`

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"` = `PrioritySchema`

### projectId?

> `optional` **projectId**: `string`

### dueDate?

> `optional` **dueDate**: `Date` = `optionalDateSchema`

### tags

> **tags**: `string`[]

### subtasks?

> `optional` **subtasks**: `object`[]

### recurring?

> `optional` **recurring**: `object`

#### recurring.type

> **type**: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`

#### recurring.interval

> **interval**: `number`

#### recurring.endDate?

> `optional` **endDate**: `Date` = `optionalDateSchema`

### userId?

> `optional` **userId**: `string`

### createdAt

> **createdAt**: `Date` = `dateSchema`

### updatedAt

> **updatedAt**: `Date` = `dateSchema`
