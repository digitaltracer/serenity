[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / FeedbackService

# Class: FeedbackService

Defined in: [packages/core/src/services/feedbackService.ts:46](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L46)

## Constructors

### Constructor

> **new FeedbackService**(): `FeedbackService`

#### Returns

`FeedbackService`

## Methods

### processFeedback()

> `static` **processFeedback**(`insightId`, `feedback`): `Promise`\<\{ `success`: `boolean`; `error?`: `string`; \}\>

Defined in: [packages/core/src/services/feedbackService.ts:51](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L51)

Process user feedback on an insight
This integrates with IPC to update the database

#### Parameters

##### insightId

`string`

##### feedback

[`UserFeedback`](../interfaces/UserFeedback.md)

#### Returns

`Promise`\<\{ `success`: `boolean`; `error?`: `string`; \}\>

***

### updateUserPreferences()

> `static` **updateUserPreferences**(`insights`): [`InsightPreferences`](../interfaces/InsightPreferences.md)

Defined in: [packages/core/src/services/feedbackService.ts:97](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L97)

Update user preferences based on feedback patterns
This learns from user behavior to improve future insights

#### Parameters

##### insights

[`InsightWithFeedback`](../interfaces/InsightWithFeedback.md)[]

#### Returns

[`InsightPreferences`](../interfaces/InsightPreferences.md)

***

### getFeedbackStats()

> `static` **getFeedbackStats**(`insights`): [`FeedbackStats`](../interfaces/FeedbackStats.md)

Defined in: [packages/core/src/services/feedbackService.ts:218](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L218)

Get feedback statistics for monitoring and display

#### Parameters

##### insights

[`InsightWithFeedback`](../interfaces/InsightWithFeedback.md)[]

#### Returns

[`FeedbackStats`](../interfaces/FeedbackStats.md)

***

### shouldDeprioritizeType()

> `static` **shouldDeprioritizeType**(`type`, `insights`): `boolean`

Defined in: [packages/core/src/services/feedbackService.ts:279](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L279)

Determine if an insight type should be deprioritized based on feedback

#### Parameters

##### type

`string`

##### insights

[`InsightWithFeedback`](../interfaces/InsightWithFeedback.md)[]

#### Returns

`boolean`

***

### shouldPrioritizeCategory()

> `static` **shouldPrioritizeCategory**(`category`, `insights`): `boolean`

Defined in: [packages/core/src/services/feedbackService.ts:301](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L301)

Determine if an insight category should be prioritized based on feedback

#### Parameters

##### category

`string`

##### insights

[`InsightWithFeedback`](../interfaces/InsightWithFeedback.md)[]

#### Returns

`boolean`

***

### getGenerationRecommendations()

> `static` **getGenerationRecommendations**(`insights`): `object`

Defined in: [packages/core/src/services/feedbackService.ts:326](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/feedbackService.ts#L326)

Get recommendations for insight generation based on feedback

#### Parameters

##### insights

[`InsightWithFeedback`](../interfaces/InsightWithFeedback.md)[]

#### Returns

`object`

##### prioritizeCategories

> **prioritizeCategories**: `string`[]

##### deprioritizeTypes

> **deprioritizeTypes**: `string`[]

##### suggestedFocus

> **suggestedFocus**: `string`[]
