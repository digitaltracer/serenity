[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SearchEngine

# Class: SearchEngine

Defined in: [packages/core/src/utils/searchEngine.ts:86](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L86)

Main search engine class

## Constructors

### Constructor

> **new SearchEngine**(): `SearchEngine`

#### Returns

`SearchEngine`

## Methods

### search()

> **search**\<`T`\>(`items`, `query`, `contentType`): [`SearchResult`](../interfaces/SearchResult.md)\<`T`\>[]

Defined in: [packages/core/src/utils/searchEngine.ts:93](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L93)

Perform comprehensive search across all content types

#### Type Parameters

##### T

`T` *extends* [`Task`](../interfaces/Task.md) \| [`JournalEntry`](../interfaces/JournalEntry.md) \| [`Project`](../interfaces/Project.md)

#### Parameters

##### items

`T`[]

##### query

[`SearchQuery`](../interfaces/SearchQuery.md)

##### contentType

[`ContentType`](../type-aliases/ContentType.md)

#### Returns

[`SearchResult`](../interfaces/SearchResult.md)\<`T`\>[]

***

### getSuggestions()

> **getSuggestions**(`query`, `availableTags`, `availableProjects`): [`SearchSuggestion`](../interfaces/SearchSuggestion.md)[]

Defined in: [packages/core/src/utils/searchEngine.ts:445](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/searchEngine.ts#L445)

Get search suggestions based on query

#### Parameters

##### query

`string`

##### availableTags

`string`[]

##### availableProjects

[`Project`](../interfaces/Project.md)[]

#### Returns

[`SearchSuggestion`](../interfaces/SearchSuggestion.md)[]
