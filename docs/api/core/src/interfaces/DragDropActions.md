[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DragDropActions

# Interface: DragDropActions

Defined in: [packages/core/src/utils/dragDrop.ts:52](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L52)

Drag and drop actions for different scenarios

## Properties

### reorderTasks()

> **reorderTasks**: (`taskIds`, `newOrder`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:54](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L54)

#### Parameters

##### taskIds

`string`[]

##### newOrder

`number`[]

#### Returns

`void`

***

### moveTaskToProject()

> **moveTaskToProject**: (`taskId`, `projectId`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:55](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L55)

#### Parameters

##### taskId

`string`

##### projectId

`string`

#### Returns

`void`

***

### changeTaskPriority()

> **changeTaskPriority**: (`taskId`, `priority`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L56)

#### Parameters

##### taskId

`string`

##### priority

`"low"` | `"medium"` | `"high"`

#### Returns

`void`

***

### scheduleTask()

> **scheduleTask**: (`taskId`, `dueDate`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L57)

#### Parameters

##### taskId

`string`

##### dueDate

`Date`

#### Returns

`void`

***

### reorderSubtasks()

> **reorderSubtasks**: (`parentTaskId`, `subtaskIds`, `newOrder`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:60](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L60)

#### Parameters

##### parentTaskId

`string`

##### subtaskIds

`string`[]

##### newOrder

`number`[]

#### Returns

`void`

***

### promoteSubtask()

> **promoteSubtask**: (`subtaskId`, `parentTaskId`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:61](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L61)

#### Parameters

##### subtaskId

`string`

##### parentTaskId

`string`

#### Returns

`void`

***

### reorderProjects()

> **reorderProjects**: (`projectIds`, `newOrder`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:64](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L64)

#### Parameters

##### projectIds

`string`[]

##### newOrder

`number`[]

#### Returns

`void`

***

### reorderJournalEntries()

> **reorderJournalEntries**: (`entryIds`, `newOrder`) => `void`

Defined in: [packages/core/src/utils/dragDrop.ts:67](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/dragDrop.ts#L67)

#### Parameters

##### entryIds

`string`[]

##### newOrder

`number`[]

#### Returns

`void`
