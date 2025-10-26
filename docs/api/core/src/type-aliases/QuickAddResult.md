[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / QuickAddResult

# Type Alias: QuickAddResult

> **QuickAddResult** = \{ `kind`: `"task"`; `task`: `Omit`\<[`Task`](../interfaces/Task.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>; `debug?`: `any`; \} \| \{ `kind`: `"journal"`; `entry`: `Omit`\<[`JournalEntry`](../interfaces/JournalEntry.md), `"id"` \| `"createdAt"` \| `"updatedAt"`\>; `debug?`: `any`; \}

Defined in: [packages/core/src/utils/nlpQuickAdd.ts:3](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/nlpQuickAdd.ts#L3)
