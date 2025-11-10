[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / useDropZone

# Function: useDropZone()

> **useDropZone**(`dropZone`, `onDrop`, `enabled`): `object`

Defined in: [packages/core/src/hooks/useDragDrop.ts:120](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/hooks/useDragDrop.ts#L120)

Hook for making an element a drop zone

## Parameters

### dropZone

[`DropZone`](../interfaces/DropZone.md)

### onDrop

(`dragItem`, `dropResult`) => `void`

### enabled

`boolean` = `true`

## Returns

`object`

### dropRef

> **dropRef**: `RefObject`\<`HTMLDivElement`\>

### isOver

> **isOver**: `boolean`

### canDrop

> **canDrop**: `boolean`

### isActive

> **isActive**: `boolean`

### dropProps

> **dropProps**: `object`

#### dropProps.style

> **style**: `object`

#### dropProps.style.backgroundColor

> **backgroundColor**: `string`

#### dropProps.style.border

> **border**: `string`

#### dropProps.style.borderRadius

> **borderRadius**: `string` = `'8px'`

#### dropProps.style.transition

> **transition**: `string` = `'all 0.2s ease'`
