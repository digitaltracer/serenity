[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / PersistenceClient

# Interface: PersistenceClient

Defined in: [packages/core/src/persistence/PersistenceClient.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L10)

## Properties

### tasks

> **tasks**: `object`

Defined in: [packages/core/src/persistence/PersistenceClient.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L12)

#### list()

> **list**(): `Promise`\<[`Task`](Task.md)[]\>

##### Returns

`Promise`\<[`Task`](Task.md)[]\>

#### create()

> **create**(`input`): `Promise`\<[`Task`](Task.md)\>

##### Parameters

###### input

`Omit`\<[`Task`](Task.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\> & `Partial`\<`Pick`\<[`Task`](Task.md), `"id"`\>\>

##### Returns

`Promise`\<[`Task`](Task.md)\>

#### update()

> **update**(`id`, `updates`): `Promise`\<[`Task`](Task.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Task`](Task.md)\>

##### Returns

`Promise`\<[`Task`](Task.md)\>

#### remove()

> **remove**(`id`): `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

***

### projects

> **projects**: `object`

Defined in: [packages/core/src/persistence/PersistenceClient.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L18)

#### list()

> **list**(): `Promise`\<[`Project`](Project.md)[]\>

##### Returns

`Promise`\<[`Project`](Project.md)[]\>

#### create()

> **create**(`input`): `Promise`\<[`Project`](Project.md)\>

##### Parameters

###### input

`Omit`\<[`Project`](Project.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\> & `Partial`\<`Pick`\<[`Project`](Project.md), `"id"`\>\>

##### Returns

`Promise`\<[`Project`](Project.md)\>

#### update()

> **update**(`id`, `updates`): `Promise`\<[`Project`](Project.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Project`](Project.md)\>

##### Returns

`Promise`\<[`Project`](Project.md)\>

#### remove()

> **remove**(`id`): `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

***

### journal

> **journal**: `object`

Defined in: [packages/core/src/persistence/PersistenceClient.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L24)

#### list()

> **list**(): `Promise`\<[`JournalEntry`](JournalEntry.md)[]\>

##### Returns

`Promise`\<[`JournalEntry`](JournalEntry.md)[]\>

#### create()

> **create**(`input`): `Promise`\<[`JournalEntry`](JournalEntry.md)\>

##### Parameters

###### input

`Omit`\<[`JournalEntry`](JournalEntry.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\> & `Partial`\<`Pick`\<[`JournalEntry`](JournalEntry.md), `"id"`\>\>

##### Returns

`Promise`\<[`JournalEntry`](JournalEntry.md)\>

#### update()

> **update**(`id`, `updates`): `Promise`\<[`JournalEntry`](JournalEntry.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`JournalEntry`](JournalEntry.md)\>

##### Returns

`Promise`\<[`JournalEntry`](JournalEntry.md)\>

#### remove()

> **remove**(`id`): `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

***

### goals

> **goals**: `object`

Defined in: [packages/core/src/persistence/PersistenceClient.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L30)

#### list()

> **list**(): `Promise`\<[`Goal`](Goal.md)[]\>

##### Returns

`Promise`\<[`Goal`](Goal.md)[]\>

#### create()

> **create**(`input`): `Promise`\<[`Goal`](Goal.md)\>

##### Parameters

###### input

`Omit`\<[`Goal`](Goal.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\> & `Partial`\<`Pick`\<[`Goal`](Goal.md), `"id"`\>\>

##### Returns

`Promise`\<[`Goal`](Goal.md)\>

#### update()

> **update**(`id`, `updates`): `Promise`\<[`Goal`](Goal.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Goal`](Goal.md)\>

##### Returns

`Promise`\<[`Goal`](Goal.md)\>

#### remove()

> **remove**(`id`): `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

***

### stats

> **stats**: `object`

Defined in: [packages/core/src/persistence/PersistenceClient.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L36)

#### get()

> **get**(): `Promise`\<[`PersistenceStats`](PersistenceStats.md)\>

##### Returns

`Promise`\<[`PersistenceStats`](PersistenceStats.md)\>

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/persistence/PersistenceClient.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/PersistenceClient.ts#L11)

#### Returns

`Promise`\<`void`\>
