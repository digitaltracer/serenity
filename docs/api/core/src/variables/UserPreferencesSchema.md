[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / UserPreferencesSchema

# Variable: UserPreferencesSchema

> `const` **UserPreferencesSchema**: `ZodObject`\<\{ `theme`: `ZodEnum`\<\[`"light"`, `"dark"`, `"system"`\]\>; `compactMode`: `ZodBoolean`; `notifications`: `ZodObject`\<\{ `enabled`: `ZodBoolean`; `sounds`: `ZodBoolean`; `taskReminders`: `ZodBoolean`; `dailyReview`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `enabled`: `boolean`; `sounds`: `boolean`; `taskReminders`: `boolean`; `dailyReview`: `boolean`; \}, \{ `enabled`: `boolean`; `sounds`: `boolean`; `taskReminders`: `boolean`; `dailyReview`: `boolean`; \}\>; `language`: `ZodString`; `dateFormat`: `ZodString`; `timeFormat`: `ZodEnum`\<\[`"12h"`, `"24h"`\]\>; \}, `"strip"`, `ZodTypeAny`, \{ `theme`: `"light"` \| `"dark"` \| `"system"`; `compactMode`: `boolean`; `notifications`: \{ `enabled`: `boolean`; `sounds`: `boolean`; `taskReminders`: `boolean`; `dailyReview`: `boolean`; \}; `language`: `string`; `dateFormat`: `string`; `timeFormat`: `"12h"` \| `"24h"`; \}, \{ `theme`: `"light"` \| `"dark"` \| `"system"`; `compactMode`: `boolean`; `notifications`: \{ `enabled`: `boolean`; `sounds`: `boolean`; `taskReminders`: `boolean`; `dailyReview`: `boolean`; \}; `language`: `string`; `dateFormat`: `string`; `timeFormat`: `"12h"` \| `"24h"`; \}\>

Defined in: [packages/core/src/validation/schemas.ts:89](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L89)
