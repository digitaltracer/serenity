[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / RecurringPatternSchema

# Variable: RecurringPatternSchema

> `const` **RecurringPatternSchema**: `ZodOptional`\<`ZodObject`\<\{ `type`: `ZodEnum`\<\[`"daily"`, `"weekly"`, `"monthly"`, `"custom"`\]\>; `interval`: `ZodNumber`; `endDate`: `ZodOptional`\<`ZodEffects`\<`ZodUnion`\<\[`ZodString`, `ZodString`, `ZodDate`, `ZodNull`, `ZodUndefined`\]\>, `Date` \| `undefined`, `string` \| `Date` \| `null` \| `undefined`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `type`: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`; `interval`: `number`; `endDate?`: `Date`; \}, \{ `type`: `"daily"` \| `"weekly"` \| `"monthly"` \| `"custom"`; `interval`: `number`; `endDate?`: `string` \| `Date` \| `null`; \}\>\>

Defined in: [packages/core/src/validation/schemas.ts:38](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L38)
