[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIAnalyzeDataResponse

# Interface: AIAnalyzeDataResponse

Defined in: [packages/core/src/types/ipc.ts:281](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L281)

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

### insights?

> `optional` **insights**: [`AIInsight`](AIInsight.md)[]

Defined in: [packages/core/src/types/ipc.ts:282](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L282)

***

### processedData?

> `optional` **processedData**: `object`

Defined in: [packages/core/src/types/ipc.ts:283](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L283)

#### taskIds

> **taskIds**: `string`[]

#### journalIds

> **journalIds**: `string`[]

#### analysisDate

> **analysisDate**: `string`

***

### message?

> `optional` **message**: `string`

Defined in: [packages/core/src/types/ipc.ts:288](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L288)

***

### usage?

> `optional` **usage**: [`AIUsageMetrics`](AIUsageMetrics.md)

Defined in: [packages/core/src/types/ipc.ts:289](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/types/ipc.ts#L289)
