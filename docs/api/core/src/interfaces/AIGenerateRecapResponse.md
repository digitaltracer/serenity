[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIGenerateRecapResponse

# Interface: AIGenerateRecapResponse

Defined in: [packages/core/src/types/ipc.ts:303](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L303)

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

### recap?

> `optional` **recap**: [`AIRecap`](AIRecap.md)

Defined in: [packages/core/src/types/ipc.ts:304](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L304)

***

### usage?

> `optional` **usage**: [`AIUsageMetrics`](AIUsageMetrics.md)

Defined in: [packages/core/src/types/ipc.ts:305](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L305)
