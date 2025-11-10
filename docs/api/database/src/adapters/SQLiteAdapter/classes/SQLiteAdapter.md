[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [database/src/adapters/SQLiteAdapter](../README.md) / SQLiteAdapter

# Class: SQLiteAdapter

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L18)

## Constructors

### Constructor

> **new SQLiteAdapter**(`config`): `SQLiteAdapter`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L23)

#### Parameters

##### config

[`SQLiteConfig`](../interfaces/SQLiteConfig.md) = `{}`

#### Returns

`SQLiteAdapter`

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:62](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L62)

Initialize the database connection

#### Returns

`Promise`\<`void`\>

***

### createSchema()

> **createSchema**(): `Promise`\<`void`\>

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:92](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L92)

Create the database schema

#### Returns

`Promise`\<`void`\>

***

### getDatabase()

> **getDatabase**(): `Database`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:686](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L686)

Get the database instance

#### Returns

`Database`

***

### testConnection()

> **testConnection**(): `Promise`\<`boolean`\>

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:696](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L696)

Test database connection

#### Returns

`Promise`\<`boolean`\>

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:713](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L713)

Get database statistics

#### Returns

`object`

##### path

> **path**: `string`

##### size

> **size**: `number`

##### tables

> **tables**: `object`[]

***

### backup()

> **backup**(`backupPath?`): `Promise`\<`string`\>

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:762](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L762)

Create a backup of the database

#### Parameters

##### backupPath?

`string`

#### Returns

`Promise`\<`string`\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:804](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L804)

Close the database connection

#### Returns

`Promise`\<`void`\>

***

### transaction()

> **transaction**\<`T`\>(`fn`): `T`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:820](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L820)

Execute a transaction

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`db`) => `T`

#### Returns

`T`

***

### vacuum()

> **vacuum**(): `void`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:832](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L832)

Vacuum the database to optimize storage

#### Returns

`void`

***

### executeRawQuery()

> **executeRawQuery**(`query`, `params?`): `any`

Defined in: [packages/database/src/adapters/SQLiteAdapter.ts:849](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/adapters/SQLiteAdapter.ts#L849)

Execute a raw SQL query with optional parameters

#### Parameters

##### query

`string`

##### params?

`any`[]

#### Returns

`any`
