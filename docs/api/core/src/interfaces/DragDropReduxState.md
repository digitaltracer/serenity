[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DragDropReduxState

# Interface: DragDropReduxState

Defined in: [packages/core/src/store/slices/dragDropSlice.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/dragDropSlice.ts#L9)

## Extends

- [`DragDropState`](DragDropState.md)

## Properties

### isAnimating

> **isAnimating**: `boolean`

Defined in: [packages/core/src/store/slices/dragDropSlice.ts:11](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/dragDropSlice.ts#L11)

***

### lastDropResult

> **lastDropResult**: [`DropResult`](DropResult.md) \| `null`

Defined in: [packages/core/src/store/slices/dragDropSlice.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/dragDropSlice.ts#L12)

***

### dropFeedback

> **dropFeedback**: `object`

Defined in: [packages/core/src/store/slices/dragDropSlice.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/dragDropSlice.ts#L13)

#### show

> **show**: `boolean`

#### message

> **message**: `string`

#### type

> **type**: `"error"` \| `"info"` \| `"success"`

***

### isDragging

> **isDragging**: `boolean`

Defined in: [packages/core/src/utils/dragDrop.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L34)

#### Inherited from

[`DragDropState`](DragDropState.md).[`isDragging`](DragDropState.md#isdragging)

***

### dragItem

> **dragItem**: [`DragItem`](DragItem.md) \| `null`

Defined in: [packages/core/src/utils/dragDrop.ts:35](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L35)

#### Inherited from

[`DragDropState`](DragDropState.md).[`dragItem`](DragDropState.md#dragitem)

***

### dropZones

> **dropZones**: [`DropZone`](DropZone.md)[]

Defined in: [packages/core/src/utils/dragDrop.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L36)

#### Inherited from

[`DragDropState`](DragDropState.md).[`dropZones`](DragDropState.md#dropzones)

***

### dragPreview?

> `optional` **dragPreview**: `HTMLElement`

Defined in: [packages/core/src/utils/dragDrop.ts:37](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L37)

#### Inherited from

[`DragDropState`](DragDropState.md).[`dragPreview`](DragDropState.md#dragpreview)
