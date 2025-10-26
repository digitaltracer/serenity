[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SearchFilters

# Interface: SearchFilters

Defined in: [packages/core/src/utils/searchEngine.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L15)

## Properties

### contentTypes

> **contentTypes**: [`ContentType`](../type-aliases/ContentType.md)[]

Defined in: [packages/core/src/utils/searchEngine.ts:17](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L17)

***

### taskStatus?

> `optional` **taskStatus**: `"completed"` \| `"pending"` \| `"all"`

Defined in: [packages/core/src/utils/searchEngine.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L20)

***

### priority?

> `optional` **priority**: `"low"` \| `"medium"` \| `"high"` \| `"all"`

Defined in: [packages/core/src/utils/searchEngine.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L21)

***

### hasSubtasks?

> `optional` **hasSubtasks**: `boolean`

Defined in: [packages/core/src/utils/searchEngine.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L22)

***

### isRecurring?

> `optional` **isRecurring**: `boolean`

Defined in: [packages/core/src/utils/searchEngine.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L23)

***

### dateRange?

> `optional` **dateRange**: [`DateRange`](DateRange.md)

Defined in: [packages/core/src/utils/searchEngine.ts:26](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L26)

***

### dueDateRange?

> `optional` **dueDateRange**: [`DateRange`](DateRange.md)

Defined in: [packages/core/src/utils/searchEngine.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L27)

***

### tags

> **tags**: `string`[]

Defined in: [packages/core/src/utils/searchEngine.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L30)

***

### tagMode

> **tagMode**: `"none"` \| `"all"` \| `"any"`

Defined in: [packages/core/src/utils/searchEngine.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L31)

***

### projectIds

> **projectIds**: `string`[]

Defined in: [packages/core/src/utils/searchEngine.ts:34](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L34)

***

### mood?

> `optional` **mood**: `"neutral"` \| `"happy"` \| `"sad"` \| `"excited"` \| `"stressed"` \| `"all"`

Defined in: [packages/core/src/utils/searchEngine.ts:37](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L37)

***

### isPinned?

> `optional` **isPinned**: `boolean`

Defined in: [packages/core/src/utils/searchEngine.ts:38](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L38)

***

### hasAttachments?

> `optional` **hasAttachments**: `boolean`

Defined in: [packages/core/src/utils/searchEngine.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L41)

***

### wordCountRange?

> `optional` **wordCountRange**: `object`

Defined in: [packages/core/src/utils/searchEngine.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L42)

#### min?

> `optional` **min**: `number`

#### max?

> `optional` **max**: `number`
