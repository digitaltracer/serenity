[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / getPostgreSQLConfigSecure

# Function: getPostgreSQLConfigSecure()

> **getPostgreSQLConfigSecure**(): `Promise`\<\{ `config`: [`SecurePostgreSQLConfig`](../interfaces/SecurePostgreSQLConfig.md); `password`: `string`; \} \| `null`\>

Defined in: [packages/core/src/utils/secureStorage.ts:794](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L794)

Retrieve PostgreSQL configuration with decrypted password

## Returns

`Promise`\<\{ `config`: [`SecurePostgreSQLConfig`](../interfaces/SecurePostgreSQLConfig.md); `password`: `string`; \} \| `null`\>
