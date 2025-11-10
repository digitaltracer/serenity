[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/userProfileService](../README.md) / ProfileUpdateContext

# Interface: ProfileUpdateContext

Defined in: [packages/core/src/services/userProfileService.ts:55](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L55)

## Properties

### tasks

> **tasks**: [`Task`](../../../interfaces/Task.md)[]

Defined in: [packages/core/src/services/userProfileService.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L56)

***

### journalEntries

> **journalEntries**: [`JournalEntry`](../../../interfaces/JournalEntry.md)[]

Defined in: [packages/core/src/services/userProfileService.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L57)

***

### goals

> **goals**: [`Goal`](../../../interfaces/Goal.md)[]

Defined in: [packages/core/src/services/userProfileService.ts:58](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L58)

***

### insights?

> `optional` **insights**: `AIInsight`[]

Defined in: [packages/core/src/services/userProfileService.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L59)

***

### insightInteractions?

> `optional` **insightInteractions**: `object`[]

Defined in: [packages/core/src/services/userProfileService.ts:60](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L60)

#### insightId

> **insightId**: `string`

#### action

> **action**: `"viewed"` \| `"actioned"` \| `"dismissed"`

#### timestamp

> **timestamp**: `string`
