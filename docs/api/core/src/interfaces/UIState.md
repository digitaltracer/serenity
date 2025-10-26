[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / UIState

# Interface: UIState

Defined in: [packages/core/src/store/slices/uiSlice.ts:3](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L3)

## Properties

### sidebarCollapsed

> **sidebarCollapsed**: `boolean`

Defined in: [packages/core/src/store/slices/uiSlice.ts:4](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L4)

***

### theme

> **theme**: `"light"` \| `"dark"` \| `"system"`

Defined in: [packages/core/src/store/slices/uiSlice.ts:5](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L5)

***

### compactMode

> **compactMode**: `boolean`

Defined in: [packages/core/src/store/slices/uiSlice.ts:6](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L6)

***

### activeModal

> **activeModal**: `string` \| `null`

Defined in: [packages/core/src/store/slices/uiSlice.ts:7](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L7)

***

### modals

> **modals**: `object`

Defined in: [packages/core/src/store/slices/uiSlice.ts:8](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L8)

#### taskModal

> **taskModal**: `boolean`

#### journalModal

> **journalModal**: `boolean`

#### subtaskModal

> **subtaskModal**: `boolean`

***

### bulkSelection

> **bulkSelection**: `object`

Defined in: [packages/core/src/store/slices/uiSlice.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L14)

#### isActive

> **isActive**: `boolean`

#### selectedItems

> **selectedItems**: `object`

##### selectedItems.tasks

> **tasks**: `string`[]

##### selectedItems.journalEntries

> **journalEntries**: `string`[]

##### selectedItems.projects

> **projects**: `string`[]

#### selectAll

> **selectAll**: `object`

##### selectAll.tasks

> **tasks**: `boolean`

##### selectAll.journalEntries

> **journalEntries**: `boolean`

##### selectAll.projects

> **projects**: `boolean`

***

### notifications

> **notifications**: `object`[]

Defined in: [packages/core/src/store/slices/uiSlice.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L27)

#### id

> **id**: `string`

#### type

> **type**: `"warning"` \| `"error"` \| `"info"` \| `"success"`

#### title

> **title**: `string`

#### message

> **message**: `string`

#### duration?

> `optional` **duration**: `number`

***

### loading

> **loading**: `object`

Defined in: [packages/core/src/store/slices/uiSlice.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/uiSlice.ts#L34)

#### Index Signature

\[`key`: `string`\]: `boolean`
