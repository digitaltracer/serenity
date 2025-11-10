[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / validateJournalEntry

# Function: validateJournalEntry()

> **validateJournalEntry**(`data`): `object`

Defined in: [packages/core/src/validation/schemas.ts:121](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L121)

## Parameters

### data

`unknown`

## Returns

`object`

### id

> **id**: `string`

### title?

> `optional` **title**: `string`

### content

> **content**: `string`

### date

> **date**: `Date` = `dateSchema`

### tags

> **tags**: `string`[]

### pinned

> **pinned**: `boolean`

### mood?

> `optional` **mood**: `"neutral"` \| `"happy"` \| `"sad"` \| `"excited"` \| `"stressed"`

### userId?

> `optional` **userId**: `string`

### createdAt

> **createdAt**: `Date` = `dateSchema`

### updatedAt

> **updatedAt**: `Date` = `dateSchema`
