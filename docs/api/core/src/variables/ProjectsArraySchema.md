[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / ProjectsArraySchema

# Variable: ProjectsArraySchema

> `const` **ProjectsArraySchema**: `ZodArray`\<`ZodObject`\<\{ `id`: `ZodString`; `name`: `ZodString`; `description`: `ZodOptional`\<`ZodString`\>; `color`: `ZodString`; `icon`: `ZodOptional`\<`ZodString`\>; `archived`: `ZodBoolean`; `userId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`\]\>, `Date`, `string` \| `Date`\>; `updatedAt`: `ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`\]\>, `Date`, `string` \| `Date`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `name`: `string`; `description?`: `string`; `color`: `string`; `icon?`: `string`; `archived`: `boolean`; `userId?`: `string`; `createdAt`: `Date`; `updatedAt`: `Date`; \}, \{ `id`: `string`; `name`: `string`; `description?`: `string`; `color`: `string`; `icon?`: `string`; `archived`: `boolean`; `userId?`: `string`; `createdAt`: `string` \| `Date`; `updatedAt`: `string` \| `Date`; \}\>, `"many"`\>

Defined in: [packages/core/src/validation/schemas.ts:115](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L115)
