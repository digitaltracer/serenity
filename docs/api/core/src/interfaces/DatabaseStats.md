[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DatabaseStats

# Interface: DatabaseStats

Defined in: [packages/core/src/types/database.ts:77](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L77)

## Properties

### type

> **type**: [`DatabaseType`](../type-aliases/DatabaseType.md)

Defined in: [packages/core/src/types/database.ts:78](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L78)

***

### size

> **size**: `number`

Defined in: [packages/core/src/types/database.ts:79](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L79)

***

### tables

> **tables**: `number`

Defined in: [packages/core/src/types/database.ts:80](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L80)

***

### records

> **records**: `object`

Defined in: [packages/core/src/types/database.ts:81](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L81)

#### tasks

> **tasks**: `number`

#### projects

> **projects**: `number`

#### journalEntries

> **journalEntries**: `number`

#### users

> **users**: `number`

***

### performance

> **performance**: `object`

Defined in: [packages/core/src/types/database.ts:87](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L87)

#### avgQueryTime

> **avgQueryTime**: `number`

#### totalQueries

> **totalQueries**: `number`

#### errorRate

> **errorRate**: `number`

***

### health

> **health**: `"warning"` \| `"healthy"` \| `"critical"`

Defined in: [packages/core/src/types/database.ts:92](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L92)

***

### lastOptimized?

> `optional` **lastOptimized**: `Date`

Defined in: [packages/core/src/types/database.ts:93](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/database.ts#L93)
