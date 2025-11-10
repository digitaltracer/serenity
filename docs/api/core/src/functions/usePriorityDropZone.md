[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / usePriorityDropZone

# Function: usePriorityDropZone()

> **usePriorityDropZone**(`priority`): `object`

Defined in: [packages/core/src/hooks/useDragDrop.ts:349](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/hooks/useDragDrop.ts#L349)

Hook for priority drop zones

## Parameters

### priority

`"low"` | `"medium"` | `"high"`

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
