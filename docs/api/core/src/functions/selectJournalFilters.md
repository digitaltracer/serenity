[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / selectJournalFilters

# Function: selectJournalFilters()

> **selectJournalFilters**(`state`): `object`

Defined in: [packages/core/src/store/slices/journalSlice.ts:122](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/journalSlice.ts#L122)

## Parameters

### state

#### journal

[`JournalState`](../interfaces/JournalState.md)

## Returns

`object`

### search

> **search**: `string`

### tags

> **tags**: `string`[]

### dateRange

> **dateRange**: `object`

#### dateRange.start

> **start**: `Date` \| `null`

#### dateRange.end

> **end**: `Date` \| `null`
