[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / TasksState

# Interface: TasksState

Defined in: [packages/core/src/store/slices/tasksSlice.ts:7](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L7)

## Properties

### tasks

> **tasks**: [`Task`](Task.md)[]

Defined in: [packages/core/src/store/slices/tasksSlice.ts:8](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L8)

***

### loading

> **loading**: `boolean`

Defined in: [packages/core/src/store/slices/tasksSlice.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L9)

***

### error

> **error**: `string` \| `null`

Defined in: [packages/core/src/store/slices/tasksSlice.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L10)

***

### filters

> **filters**: `object`

Defined in: [packages/core/src/store/slices/tasksSlice.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L11)

#### search

> **search**: `string`

#### priority

> **priority**: `"low"` \| `"medium"` \| `"high"` \| `"all"`

#### status

> **status**: `"completed"` \| `"pending"` \| `"all"`

#### project

> **project**: `string` \| `null`

***

### pagination

> **pagination**: `object`

Defined in: [packages/core/src/store/slices/tasksSlice.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/tasksSlice.ts#L17)

#### currentPage

> **currentPage**: `number`

#### tasksPerPage

> **tasksPerPage**: `number`

#### hasMore

> **hasMore**: `boolean`
