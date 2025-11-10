[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / AIRecapEnhanced

# Interface: AIRecapEnhanced

Defined in: [packages/core/src/store/slices/insightsSlice.ts:40](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L40)

Recap with interaction tracking

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L41)

***

### type

> **type**: `"weekly"` \| `"monthly"`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L42)

***

### title

> **title**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:43](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L43)

***

### summary

> **summary**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:44](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L44)

***

### highlights

> **highlights**: `string`[]

Defined in: [packages/core/src/store/slices/insightsSlice.ts:45](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L45)

***

### challenges

> **challenges**: `string`[]

Defined in: [packages/core/src/store/slices/insightsSlice.ts:46](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L46)

***

### recommendations

> **recommendations**: `string`[]

Defined in: [packages/core/src/store/slices/insightsSlice.ts:47](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L47)

***

### period

> **period**: `object`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:48](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L48)

#### start

> **start**: `string`

#### end

> **end**: `string`

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:52](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L52)

***

### source

> **source**: `"openai"` \| `"gemini"` \| `"anthropic"` \| `"local"`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:53](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L53)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/store/slices/insightsSlice.ts:54](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L54)

***

### viewed?

> `optional` **viewed**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L56)

***

### favorited?

> `optional` **favorited**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L57)

***

### exported?

> `optional` **exported**: `boolean`

Defined in: [packages/core/src/store/slices/insightsSlice.ts:58](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/insightsSlice.ts#L58)
