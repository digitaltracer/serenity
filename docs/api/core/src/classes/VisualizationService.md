[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / VisualizationService

# Class: VisualizationService

Defined in: [packages/core/src/services/visualizationService.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L41)

## Constructors

### Constructor

> **new VisualizationService**(): `VisualizationService`

#### Returns

`VisualizationService`

## Methods

### generateKPIMetrics()

> `static` **generateKPIMetrics**(`data`): `KPIMetrics`

Defined in: [packages/core/src/services/visualizationService.ts:45](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L45)

Generate KPI metrics from tasks and journal entries

#### Parameters

##### data

###### tasks

[`Task`](../interfaces/Task.md)[]

###### journalEntries

[`JournalEntry`](../interfaces/JournalEntry.md)[]

###### timeRange

`TimeRange`

#### Returns

`KPIMetrics`

***

### calculateProductivityScore()

> `static` **calculateProductivityScore**(`tasks`, `timeRange`): `number`

Defined in: [packages/core/src/services/visualizationService.ts:213](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L213)

Calculate productivity score for a given time range

#### Parameters

##### tasks

[`Task`](../interfaces/Task.md)[]

##### timeRange

`TimeRange`

#### Returns

`number`

***

### calculateActiveStreak()

> `static` **calculateActiveStreak**(`tasks`, `journalEntries`): `number`

Defined in: [packages/core/src/services/visualizationService.ts:262](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L262)

Calculate active streak

#### Parameters

##### tasks

[`Task`](../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../interfaces/JournalEntry.md)[]

#### Returns

`number`

***

### generateTrendData()

> `static` **generateTrendData**(`tasks`, `journalEntries`, `metric`, `granularity`, `timeRange`): `TrendDataPoint`[]

Defined in: [packages/core/src/services/visualizationService.ts:305](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L305)

Generate time-series data for trend charts

#### Parameters

##### tasks

[`Task`](../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../interfaces/JournalEntry.md)[]

##### metric

`"productivity"` | `"mood"` | `"completion"` | `"velocity"`

##### granularity

`"day"` | `"week"` | `"month"`

##### timeRange

`TimeRange`

#### Returns

`TrendDataPoint`[]

***

### extractMoodTrend()

> `static` **extractMoodTrend**(`journalEntries`, `timeRange`): `object`[]

Defined in: [packages/core/src/services/visualizationService.ts:471](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L471)

Extract mood trend from journal entries

#### Parameters

##### journalEntries

[`JournalEntry`](../interfaces/JournalEntry.md)[]

##### timeRange

`TimeRange`

#### Returns

`object`[]

***

### generateDualAxisData()

> `static` **generateDualAxisData**(`tasks`, `journalEntries`, `timeRange`, `granularity`): `object`[]

Defined in: [packages/core/src/services/visualizationService.ts:498](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/visualizationService.ts#L498)

Generate dual-axis chart data (e.g., tasks vs mood)

#### Parameters

##### tasks

[`Task`](../interfaces/Task.md)[]

##### journalEntries

[`JournalEntry`](../interfaces/JournalEntry.md)[]

##### timeRange

`TimeRange`

##### granularity

`"day"` | `"week"` | `"month"`

#### Returns

`object`[]
