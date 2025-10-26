[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / useDraggable

# Function: useDraggable()

> **useDraggable**(`dragItem`, `enabled`): `object`

Defined in: [packages/core/src/hooks/useDragDrop.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/hooks/useDragDrop.ts#L42)

Hook for making an element draggable

## Parameters

### dragItem

[`DragItem`](../interfaces/DragItem.md)

### enabled

`boolean` = `true`

## Returns

`object`

### dragRef

> **dragRef**: `RefObject`\<`HTMLDivElement`\>

### isDragging

> **isDragging**: `boolean`

### dragProps

> **dragProps**: `object`

#### dragProps.draggable

> **draggable**: `boolean` = `enabled`

#### dragProps.style

> **style**: `object`

#### dragProps.style.cursor

> **cursor**: `string`

#### dragProps.style.opacity

> **opacity**: `number`
