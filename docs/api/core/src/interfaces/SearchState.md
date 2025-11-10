[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SearchState

# Interface: SearchState

Defined in: [packages/core/src/store/slices/searchSlice.ts:18](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L18)

## Properties

### query

> **query**: [`SearchQuery`](SearchQuery.md)

Defined in: [packages/core/src/store/slices/searchSlice.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L20)

***

### results

> **results**: [`SearchResult`](SearchResult.md)\<`any`\>[]

Defined in: [packages/core/src/store/slices/searchSlice.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L21)

***

### isSearching

> **isSearching**: `boolean`

Defined in: [packages/core/src/store/slices/searchSlice.ts:22](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L22)

***

### isGlobalSearchOpen

> **isGlobalSearchOpen**: `boolean`

Defined in: [packages/core/src/store/slices/searchSlice.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L25)

***

### isAdvancedFiltersOpen

> **isAdvancedFiltersOpen**: `boolean`

Defined in: [packages/core/src/store/slices/searchSlice.ts:26](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L26)

***

### suggestions

> **suggestions**: [`SearchSuggestion`](SearchSuggestion.md)[]

Defined in: [packages/core/src/store/slices/searchSlice.ts:29](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L29)

***

### recentSearches

> **recentSearches**: `string`[]

Defined in: [packages/core/src/store/slices/searchSlice.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L30)

***

### searchHistory

> **searchHistory**: `object`[]

Defined in: [packages/core/src/store/slices/searchSlice.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L33)

#### query

> **query**: `string`

#### timestamp

> **timestamp**: `Date`

#### resultCount

> **resultCount**: `number`

***

### lastSearchTime

> **lastSearchTime**: `number`

Defined in: [packages/core/src/store/slices/searchSlice.ts:40](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L40)

***

### error

> **error**: `string` \| `null`

Defined in: [packages/core/src/store/slices/searchSlice.ts:43](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/store/slices/searchSlice.ts#L43)
