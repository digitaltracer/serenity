[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/database/DatabaseManager](../README.md) / DatabaseManager

# Class: DatabaseManager

Defined in: [packages/core/src/database/DatabaseManager.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L16)

## Implements

- [`DatabaseOperations`](../../../interfaces/DatabaseOperations.md)

## Constructors

### Constructor

> **new DatabaseManager**(): `DatabaseManager`

#### Returns

`DatabaseManager`

## Methods

### getRecommendedConfigs()

> `static` **getRecommendedConfigs**(): `object`

Defined in: [packages/core/src/database/DatabaseManager.ts:259](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L259)

Get recommended database configurations for different use cases

#### Returns

`object`

##### personal

> **personal**: `object`

###### personal.id

> **id**: `string` = `'personal-sqlite'`

###### personal.name

> **name**: `string` = `'Personal (SQLite)'`

###### personal.description

> **description**: `string` = `'Fast local database, perfect for personal use'`

###### personal.config

> **config**: `object`

###### personal.config.type

> **type**: `"sqlite"`

###### personal.config.encryption

> **encryption**: `boolean` = `true`

###### personal.recommended

> **recommended**: `boolean` = `true`

###### personal.tags

> **tags**: `string`[]

##### selfHosted

> **selfHosted**: `object`

###### selfHosted.id

> **id**: `string` = `'self-hosted-postgres'`

###### selfHosted.name

> **name**: `string` = `'Self-Hosted (PostgreSQL)'`

###### selfHosted.description

> **description**: `string` = `'Full-featured database for power users and teams'`

###### selfHosted.config

> **config**: `object`

###### selfHosted.config.type

> **type**: `"postgresql"`

###### selfHosted.config.host

> **host**: `string` = `'localhost'`

###### selfHosted.config.port

> **port**: `number` = `5432`

###### selfHosted.config.database

> **database**: `string` = `'serenity_notes'`

###### selfHosted.config.username

> **username**: `string` = `'serenity'`

###### selfHosted.config.password

> **password**: `string` = `''`

###### selfHosted.config.ssl

> **ssl**: `boolean` = `false`

###### selfHosted.recommended

> **recommended**: `boolean` = `false`

###### selfHosted.tags

> **tags**: `string`[]

##### cloud

> **cloud**: `object`

###### cloud.id

> **id**: `string` = `'cloud-postgres'`

###### cloud.name

> **name**: `string` = `'Cloud PostgreSQL'`

###### cloud.description

> **description**: `string` = `'Managed PostgreSQL for teams and businesses'`

###### cloud.config

> **config**: `object`

###### cloud.config.type

> **type**: `"postgresql"`

###### cloud.config.host

> **host**: `string` = `''`

###### cloud.config.port

> **port**: `number` = `5432`

###### cloud.config.database

> **database**: `string` = `'serenity_notes'`

###### cloud.config.username

> **username**: `string` = `''`

###### cloud.config.password

> **password**: `string` = `''`

###### cloud.config.ssl

> **ssl**: `boolean` = `true`

###### cloud.recommended

> **recommended**: `boolean` = `false`

###### cloud.tags

> **tags**: `string`[]

***

### connect()

> **connect**(`config`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L27)

Connect to database using the specified configuration

#### Parameters

##### config

[`DatabaseConfig`](../../../type-aliases/DatabaseConfig.md)

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`connect`](../../../interfaces/DatabaseOperations.md#connect)

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:78](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L78)

Disconnect from current database

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`disconnect`](../../../interfaces/DatabaseOperations.md#disconnect)

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: [packages/core/src/database/DatabaseManager.ts:96](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L96)

Check if currently connected to a database

#### Returns

`boolean`

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`isConnected`](../../../interfaces/DatabaseOperations.md#isconnected)

***

### testConnection()

> **testConnection**(): `Promise`\<`boolean`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:103](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L103)

Test current database connection

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`testConnection`](../../../interfaces/DatabaseOperations.md#testconnection)

***

### migrate()

> **migrate**(): `Promise`\<`void`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:133](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L133)

Run database migrations

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`migrate`](../../../interfaces/DatabaseOperations.md#migrate)

***

### getVersion()

> **getVersion**(): `Promise`\<`string` \| `null`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:146](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L146)

Get current database schema version

#### Returns

`Promise`\<`string` \| `null`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`getVersion`](../../../interfaces/DatabaseOperations.md#getversion)

***

### backup()

> **backup**(`path`): `Promise`\<`void`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:157](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L157)

Backup database to specified path

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`backup`](../../../interfaces/DatabaseOperations.md#backup)

***

### restore()

> **restore**(`path`): `Promise`\<`void`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:170](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L170)

Restore database from backup

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`restore`](../../../interfaces/DatabaseOperations.md#restore)

***

### vacuum()

> **vacuum**(): `Promise`\<`void`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:183](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L183)

Optimize database (vacuum, analyze, etc.)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`vacuum`](../../../interfaces/DatabaseOperations.md#vacuum)

***

### getStats()

> **getStats**(): `Promise`\<[`DatabaseStats`](../../../interfaces/DatabaseStats.md)\>

Defined in: [packages/core/src/database/DatabaseManager.ts:196](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L196)

Get database statistics and health information

#### Returns

`Promise`\<[`DatabaseStats`](../../../interfaces/DatabaseStats.md)\>

#### Implementation of

[`DatabaseOperations`](../../../interfaces/DatabaseOperations.md).[`getStats`](../../../interfaces/DatabaseOperations.md#getstats)

***

### getConnectionStatus()

> **getConnectionStatus**(): [`DatabaseConnectionStatus`](../../../interfaces/DatabaseConnectionStatus.md)

Defined in: [packages/core/src/database/DatabaseManager.ts:207](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L207)

Get current connection status

#### Returns

[`DatabaseConnectionStatus`](../../../interfaces/DatabaseConnectionStatus.md)

***

### getCurrentConfig()

> **getCurrentConfig**(): [`DatabaseConfig`](../../../type-aliases/DatabaseConfig.md) \| `null`

Defined in: [packages/core/src/database/DatabaseManager.ts:214](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L214)

Get current database configuration

#### Returns

[`DatabaseConfig`](../../../type-aliases/DatabaseConfig.md) \| `null`

***

### switchDatabase()

> **switchDatabase**(`config`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/database/DatabaseManager.ts:221](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/database/DatabaseManager.ts#L221)

Switch to a different database configuration

#### Parameters

##### config

[`DatabaseConfig`](../../../type-aliases/DatabaseConfig.md)

#### Returns

`Promise`\<`boolean`\>
