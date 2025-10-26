[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / JournalEntrySchema

# Variable: JournalEntrySchema

> `const` **JournalEntrySchema**: `ZodObject`\<\{ `id`: `ZodString`; `title`: `ZodOptional`\<`ZodString`\>; `content`: `ZodString`; `date`: `ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`\]\>, `Date`, `string` \| `Date`\>; `tags`: `ZodArray`\<`ZodString`, `"many"`\>; `pinned`: `ZodBoolean`; `mood`: `ZodOptional`\<`ZodEnum`\<\[`"happy"`, `"excited"`, `"neutral"`, `"sad"`, `"stressed"`\]\>\>; `userId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`\]\>, `Date`, `string` \| `Date`\>; `updatedAt`: `ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`\]\>, `Date`, `string` \| `Date`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `title?`: `string`; `content`: `string`; `date`: `Date`; `tags`: `string`[]; `pinned`: `boolean`; `mood?`: `"neutral"` \| `"happy"` \| `"sad"` \| `"excited"` \| `"stressed"`; `userId?`: `string`; `createdAt`: `Date`; `updatedAt`: `Date`; \}, \{ `id`: `string`; `title?`: `string`; `content`: `string`; `date`: `string` \| `Date`; `tags`: `string`[]; `pinned`: `boolean`; `mood?`: `"neutral"` \| `"happy"` \| `"sad"` \| `"excited"` \| `"stressed"`; `userId?`: `string`; `createdAt`: `string` \| `Date`; `updatedAt`: `string` \| `Date`; \}\>

Defined in: [packages/core/src/validation/schemas.ts:75](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L75)
