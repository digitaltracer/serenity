[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / throwDatabaseError

# Function: throwDatabaseError()

> **throwDatabaseError**(`code`, `originalError?`, `context?`): `never`

Defined in: [packages/core/src/utils/errorHandler.ts:469](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L469)

Create and throw a database error

## Parameters

### code

`"DB_CONNECTION_FAILED"` | `"DB_QUERY_FAILED"` | `"DB_MIGRATION_FAILED"` | `"DB_BACKUP_FAILED"`

### originalError?

`Error`

### context?

`Record`\<`string`, `any`\>

## Returns

`never`
