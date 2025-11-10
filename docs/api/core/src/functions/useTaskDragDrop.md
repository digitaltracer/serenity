[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / useTaskDragDrop

# Function: useTaskDragDrop()

> **useTaskDragDrop**(): `object`

Defined in: [packages/core/src/hooks/useDragDrop.ts:261](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/hooks/useDragDrop.ts#L261)

Hook for task-specific drag and drop operations

## Returns

`object`

### handleTaskDrop()

> **handleTaskDrop**: (`dragItem`, `dropResult`) => `void`

#### Parameters

##### dragItem

[`DragItem`](../interfaces/DragItem.md)

##### dropResult

[`DropResult`](../interfaces/DropResult.md)

#### Returns

`void`

### handleSubtaskDrop()

> **handleSubtaskDrop**: (`dragItem`, `dropResult`) => `void`

#### Parameters

##### dragItem

[`DragItem`](../interfaces/DragItem.md)

##### dropResult

[`DropResult`](../interfaces/DropResult.md)

#### Returns

`void`

### createTaskDragItem()

> **createTaskDragItem**: (`task`, `sourceIndex?`, `sourceContainer?`) => [`DragItem`](../interfaces/DragItem.md)

#### Parameters

##### task

`any`

##### sourceIndex?

`number`

##### sourceContainer?

`string`

#### Returns

[`DragItem`](../interfaces/DragItem.md)

### createSubtaskDragItem()

> **createSubtaskDragItem**: (`subtask`, `parentTaskId`, `sourceIndex?`) => [`DragItem`](../interfaces/DragItem.md)

#### Parameters

##### subtask

`any`

##### parentTaskId

`string`

##### sourceIndex?

`number`

#### Returns

[`DragItem`](../interfaces/DragItem.md)
