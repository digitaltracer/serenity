[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / JournalState

# Interface: JournalState

Defined in: [packages/core/src/store/slices/journalSlice.ts:7](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L7)

## Properties

### entries

> **entries**: [`JournalEntry`](JournalEntry.md)[]

Defined in: [packages/core/src/store/slices/journalSlice.ts:8](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L8)

***

### loading

> **loading**: `boolean`

Defined in: [packages/core/src/store/slices/journalSlice.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L9)

***

### error

> **error**: `string` \| `null`

Defined in: [packages/core/src/store/slices/journalSlice.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L10)

***

### filters

> **filters**: `object`

Defined in: [packages/core/src/store/slices/journalSlice.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L11)

#### search

> **search**: `string`

#### tags

> **tags**: `string`[]

#### dateRange

> **dateRange**: `object`

##### dateRange.start

> **start**: `Date` \| `null`

##### dateRange.end

> **end**: `Date` \| `null`
