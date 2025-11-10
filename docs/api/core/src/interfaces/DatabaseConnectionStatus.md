[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DatabaseConnectionStatus

# Interface: DatabaseConnectionStatus

Defined in: [packages/core/src/types/database.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L36)

## Properties

### connected

> **connected**: `boolean`

Defined in: [packages/core/src/types/database.ts:37](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L37)

***

### type

> **type**: [`DatabaseType`](../type-aliases/DatabaseType.md)

Defined in: [packages/core/src/types/database.ts:38](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L38)

***

### lastConnected?

> `optional` **lastConnected**: `Date`

Defined in: [packages/core/src/types/database.ts:39](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L39)

***

### error?

> `optional` **error**: `string`

Defined in: [packages/core/src/types/database.ts:40](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L40)

***

### performance?

> `optional` **performance**: `object`

Defined in: [packages/core/src/types/database.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L41)

#### latency

> **latency**: `number`

#### throughput

> **throughput**: `number`
