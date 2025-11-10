[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / selectBulkSelectionState

# Function: selectBulkSelectionState()

> **selectBulkSelectionState**(`state`): `object`

Defined in: [packages/core/src/store/slices/uiSlice.ts:222](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L222)

## Parameters

### state

#### ui

[`UIState`](../interfaces/UIState.md)

## Returns

`object`

### isActive

> **isActive**: `boolean`

### selectedItems

> **selectedItems**: `object`

#### selectedItems.tasks

> **tasks**: `string`[]

#### selectedItems.journalEntries

> **journalEntries**: `string`[]

#### selectedItems.projects

> **projects**: `string`[]

### selectAll

> **selectAll**: `object`

#### selectAll.tasks

> **tasks**: `boolean`

#### selectAll.journalEntries

> **journalEntries**: `boolean`

#### selectAll.projects

> **projects**: `boolean`
