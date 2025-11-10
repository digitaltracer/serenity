[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / WebApiPersistenceClient

# Class: WebApiPersistenceClient

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L9)

## Implements

- [`PersistenceClient`](../interfaces/PersistenceClient.md)

## Constructors

### Constructor

> **new WebApiPersistenceClient**(`options`): `WebApiPersistenceClient`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L13)

#### Parameters

##### options

`WebApiClientOptions`

#### Returns

`WebApiPersistenceClient`

## Properties

### tasks

> **tasks**: `object`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:35](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L35)

#### list()

> **list**: () => `Promise`\<[`Task`](../interfaces/Task.md)[]\>

##### Returns

`Promise`\<[`Task`](../interfaces/Task.md)[]\>

#### create()

> **create**: (`input`) => `Promise`\<[`Task`](../interfaces/Task.md)\>

##### Parameters

###### input

`Partial`\<[`Task`](../interfaces/Task.md)\> & `Omit`\<[`Task`](../interfaces/Task.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

##### Returns

`Promise`\<[`Task`](../interfaces/Task.md)\>

#### update()

> **update**: (`id`, `updates`) => `Promise`\<[`Task`](../interfaces/Task.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Task`](../interfaces/Task.md)\>

##### Returns

`Promise`\<[`Task`](../interfaces/Task.md)\>

#### remove()

> **remove**: (`id`) => `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`tasks`](../interfaces/PersistenceClient.md#tasks)

***

### projects

> **projects**: `object`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:50](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L50)

#### list()

> **list**: () => `Promise`\<[`Project`](../interfaces/Project.md)[]\>

##### Returns

`Promise`\<[`Project`](../interfaces/Project.md)[]\>

#### create()

> **create**: (`input`) => `Promise`\<[`Project`](../interfaces/Project.md)\>

##### Parameters

###### input

`Partial`\<[`Project`](../interfaces/Project.md)\> & `Omit`\<[`Project`](../interfaces/Project.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

##### Returns

`Promise`\<[`Project`](../interfaces/Project.md)\>

#### update()

> **update**: (`id`, `updates`) => `Promise`\<[`Project`](../interfaces/Project.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Project`](../interfaces/Project.md)\>

##### Returns

`Promise`\<[`Project`](../interfaces/Project.md)\>

#### remove()

> **remove**: (`id`) => `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`projects`](../interfaces/PersistenceClient.md#projects)

***

### journal

> **journal**: `object`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:63](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L63)

#### list()

> **list**: () => `Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)[]\>

##### Returns

`Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)[]\>

#### create()

> **create**: (`input`) => `Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)\>

##### Parameters

###### input

`Partial`\<[`JournalEntry`](../interfaces/JournalEntry.md)\> & `Omit`\<[`JournalEntry`](../interfaces/JournalEntry.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

##### Returns

`Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)\>

#### update()

> **update**: (`id`, `updates`) => `Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`JournalEntry`](../interfaces/JournalEntry.md)\>

##### Returns

`Promise`\<[`JournalEntry`](../interfaces/JournalEntry.md)\>

#### remove()

> **remove**: (`id`) => `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`journal`](../interfaces/PersistenceClient.md#journal)

***

### goals

> **goals**: `object`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:76](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L76)

#### list()

> **list**: () => `Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

##### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

#### create()

> **create**: (`input`) => `Promise`\<[`Goal`](../interfaces/Goal.md)\>

##### Parameters

###### input

`Partial`\<[`Goal`](../interfaces/Goal.md)\> & `Omit`\<[`Goal`](../interfaces/Goal.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>

##### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)\>

#### update()

> **update**: (`id`, `updates`) => `Promise`\<[`Goal`](../interfaces/Goal.md)\>

##### Parameters

###### id

`string`

###### updates

`Partial`\<[`Goal`](../interfaces/Goal.md)\>

##### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)\>

#### remove()

> **remove**: (`id`) => `Promise`\<`void`\>

##### Parameters

###### id

`string`

##### Returns

`Promise`\<`void`\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`goals`](../interfaces/PersistenceClient.md#goals)

***

### stats

> **stats**: `object`

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:89](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L89)

#### get()

> **get**: () => `Promise`\<[`PersistenceStats`](../interfaces/PersistenceStats.md)\>

##### Returns

`Promise`\<[`PersistenceStats`](../interfaces/PersistenceStats.md)\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`stats`](../interfaces/PersistenceClient.md#stats)

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/core/src/persistence/WebApiPersistenceClient.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/persistence/WebApiPersistenceClient.ts#L18)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PersistenceClient`](../interfaces/PersistenceClient.md).[`initialize`](../interfaces/PersistenceClient.md#initialize)
