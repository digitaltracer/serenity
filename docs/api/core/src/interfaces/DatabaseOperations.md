[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DatabaseOperations

# Interface: DatabaseOperations

Defined in: [packages/core/src/types/database.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L57)

## Methods

### connect()

> **connect**(`config`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/types/database.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L59)

#### Parameters

##### config

[`DatabaseConfig`](../type-aliases/DatabaseConfig.md)

#### Returns

`Promise`\<`boolean`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/core/src/types/database.ts:60](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L60)

#### Returns

`Promise`\<`void`\>

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: [packages/core/src/types/database.ts:61](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L61)

#### Returns

`boolean`

***

### testConnection()

> **testConnection**(): `Promise`\<`boolean`\>

Defined in: [packages/core/src/types/database.ts:62](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L62)

#### Returns

`Promise`\<`boolean`\>

***

### migrate()

> **migrate**(): `Promise`\<`void`\>

Defined in: [packages/core/src/types/database.ts:65](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L65)

#### Returns

`Promise`\<`void`\>

***

### getVersion()

> **getVersion**(): `Promise`\<`string` \| `null`\>

Defined in: [packages/core/src/types/database.ts:66](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L66)

#### Returns

`Promise`\<`string` \| `null`\>

***

### backup()

> **backup**(`path`): `Promise`\<`void`\>

Defined in: [packages/core/src/types/database.ts:69](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L69)

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

***

### restore()

> **restore**(`path`): `Promise`\<`void`\>

Defined in: [packages/core/src/types/database.ts:70](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L70)

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`void`\>

***

### vacuum()

> **vacuum**(): `Promise`\<`void`\>

Defined in: [packages/core/src/types/database.ts:71](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L71)

#### Returns

`Promise`\<`void`\>

***

### getStats()

> **getStats**(): `Promise`\<[`DatabaseStats`](DatabaseStats.md)\>

Defined in: [packages/core/src/types/database.ts:74](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L74)

#### Returns

`Promise`\<[`DatabaseStats`](DatabaseStats.md)\>
