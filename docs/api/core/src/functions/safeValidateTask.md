[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / safeValidateTask

# Function: safeValidateTask()

> **safeValidateTask**(`data`): \{ `id`: `string`; `title`: `string`; `description?`: `string`; `completed`: `boolean`; `priority`: `"low"` \| `"medium"` \| `"high"`; `projectId?`: `string`; `dueDate?`: `Date`; `tags`: `string`[]; `subtasks?`: `object`[]; `recurring?`: \{ `type`: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`; `interval`: `number`; `endDate?`: `Date`; \}; `userId?`: `string`; `createdAt`: `Date`; `updatedAt`: `Date`; \} \| `null`

Defined in: [packages/core/src/validation/schemas.ts:131](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L131)

## Parameters

### data

`unknown`

## Returns

\{ `id`: `string`; `title`: `string`; `description?`: `string`; `completed`: `boolean`; `priority`: `"low"` \| `"medium"` \| `"high"`; `projectId?`: `string`; `dueDate?`: `Date`; `tags`: `string`[]; `subtasks?`: `object`[]; `recurring?`: \{ `type`: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`; `interval`: `number`; `endDate?`: `Date`; \}; `userId?`: `string`; `createdAt`: `Date`; `updatedAt`: `Date`; \} \| `null`
