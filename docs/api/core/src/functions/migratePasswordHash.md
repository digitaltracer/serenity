[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / migratePasswordHash

# Function: migratePasswordHash()

> **migratePasswordHash**(`password`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/utils/privacy.ts:195](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/privacy.ts#L195)

Migrate password from old SHA-256 format to bcrypt
This requires the user to re-enter their password

## Parameters

### password

`string`

## Returns

`Promise`\<`boolean`\>
