[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/insightQualityService](../README.md) / InsightQualityService

# Class: InsightQualityService

Defined in: [packages/core/src/services/insightQualityService.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L33)

## Constructors

### Constructor

> **new InsightQualityService**(): `InsightQualityService`

#### Returns

`InsightQualityService`

## Methods

### scoreInsight()

> `static` **scoreInsight**(`insight`, `context?`): [`ScoredInsight`](../interfaces/ScoredInsight.md)

Defined in: [packages/core/src/services/insightQualityService.ts:202](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L202)

Score a single insight

#### Parameters

##### insight

`AIInsight`

##### context?

###### previousInsights?

`AIInsight`[]

###### focusAreas?

`string`[]

###### recentCategories?

`string`[]

#### Returns

[`ScoredInsight`](../interfaces/ScoredInsight.md)

***

### scoreInsights()

> `static` **scoreInsights**(`insights`, `context?`): [`ScoredInsight`](../interfaces/ScoredInsight.md)[]

Defined in: [packages/core/src/services/insightQualityService.ts:236](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L236)

Score multiple insights

#### Parameters

##### insights

`AIInsight`[]

##### context?

###### previousInsights?

`AIInsight`[]

###### focusAreas?

`string`[]

###### recentCategories?

`string`[]

#### Returns

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

***

### validateInsight()

> `static` **validateInsight**(`insight`): `object`

Defined in: [packages/core/src/services/insightQualityService.ts:250](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L250)

Validate that an insight meets minimum quality standards

#### Parameters

##### insight

`AIInsight`

#### Returns

`object`

##### valid

> **valid**: `boolean`

##### reasons

> **reasons**: `string`[]

***

### filterByQuality()

> `static` **filterByQuality**(`scoredInsights`, `minimumScore`): [`ScoredInsight`](../interfaces/ScoredInsight.md)[]

Defined in: [packages/core/src/services/insightQualityService.ts:295](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L295)

Filter insights by quality threshold

#### Parameters

##### scoredInsights

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

##### minimumScore

`number` = `...`

#### Returns

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

***

### deduplicateInsights()

> `static` **deduplicateInsights**(`scoredInsights`): [`DeduplicationResult`](../interfaces/DeduplicationResult.md)

Defined in: [packages/core/src/services/insightQualityService.ts:349](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L349)

Deduplicate insights, keeping the highest quality version

#### Parameters

##### scoredInsights

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

#### Returns

[`DeduplicationResult`](../interfaces/DeduplicationResult.md)

***

### rankInsights()

> `static` **rankInsights**(`scoredInsights`): [`ScoredInsight`](../interfaces/ScoredInsight.md)[]

Defined in: [packages/core/src/services/insightQualityService.ts:402](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L402)

Rank insights by overall quality score

#### Parameters

##### scoredInsights

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

#### Returns

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

***

### processInsights()

> `static` **processInsights**(`insights`, `context?`): [`ScoredInsight`](../interfaces/ScoredInsight.md)[]

Defined in: [packages/core/src/services/insightQualityService.ts:420](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L420)

Full quality pipeline: validate → score → filter → deduplicate → rank

#### Parameters

##### insights

`AIInsight`[]

##### context?

###### previousInsights?

`AIInsight`[]

###### focusAreas?

`string`[]

###### recentCategories?

`string`[]

###### minimumQuality?

`number`

#### Returns

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

***

### getQualityTier()

> `static` **getQualityTier**(`score`): `"excellent"` \| `"good"` \| `"fair"` \| `"poor"`

Defined in: [packages/core/src/services/insightQualityService.ts:487](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L487)

Get quality tier label for UI

#### Parameters

##### score

`number`

#### Returns

`"excellent"` \| `"good"` \| `"fair"` \| `"poor"`

***

### generateQualityReport()

> `static` **generateQualityReport**(`scoredInsights`): `object`

Defined in: [packages/core/src/services/insightQualityService.ts:497](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/insightQualityService.ts#L497)

Generate quality report for debugging/monitoring

#### Parameters

##### scoredInsights

[`ScoredInsight`](../interfaces/ScoredInsight.md)[]

#### Returns

`object`

##### total

> **total**: `number`

##### byTier

> **byTier**: `Record`\<`string`, `number`\>

##### avgScores

> **avgScores**: [`InsightQualityScore`](../interfaces/InsightQualityScore.md)

##### topInsights

> **topInsights**: [`ScoredInsight`](../interfaces/ScoredInsight.md)[]

##### lowQualityInsights

> **lowQualityInsights**: [`ScoredInsight`](../interfaces/ScoredInsight.md)[]
