[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AISetApiKeyResponse

# Interface: AISetApiKeyResponse

Defined in: [packages/core/src/types/ipc.ts:261](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L261)

## Extends

- [`BaseIPCResponse`](BaseIPCResponse.md)

## Properties

### success

> **success**: `boolean`

Defined in: [packages/core/src/types/ipc.ts:58](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L58)

#### Inherited from

[`BaseIPCResponse`](BaseIPCResponse.md).[`success`](BaseIPCResponse.md#success)

***

### error?

> `optional` **error**: `string`

Defined in: [packages/core/src/types/ipc.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L59)

#### Inherited from

[`BaseIPCResponse`](BaseIPCResponse.md).[`error`](BaseIPCResponse.md#error)

***

### modelInfo?

> `optional` **modelInfo**: [`AIModelInfo`](AIModelInfo.md)

Defined in: [packages/core/src/types/ipc.ts:262](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L262)

***

### usage?

> `optional` **usage**: [`AIUsageMetrics`](AIUsageMetrics.md)

Defined in: [packages/core/src/types/ipc.ts:263](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L263)
