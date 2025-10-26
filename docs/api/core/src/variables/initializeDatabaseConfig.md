[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / initializeDatabaseConfig

# Variable: initializeDatabaseConfig

> `const` **initializeDatabaseConfig**: `AsyncThunk`\<\{ `config`: `null`; `status`: \{ `connected`: `boolean`; `type`: `"sqlite"`; `error?`: `undefined`; \}; `stats?`: `undefined`; \} \| \{ `config`: [`DatabaseConfig`](../type-aliases/DatabaseConfig.md); `status`: [`DatabaseConnectionStatus`](../interfaces/DatabaseConnectionStatus.md); `stats`: [`DatabaseStats`](../interfaces/DatabaseStats.md); \} \| \{ `stats?`: `undefined`; `config`: [`DatabaseConfig`](../type-aliases/DatabaseConfig.md); `status`: \{ `connected`: `boolean`; `type`: `"sqlite"` \| `"postgresql"`; `error`: `string`; \}; \}, `void`, `AsyncThunkConfig`\>

Defined in: [packages/core/src/store/slices/databaseSlice.ts:53](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/databaseSlice.ts#L53)
