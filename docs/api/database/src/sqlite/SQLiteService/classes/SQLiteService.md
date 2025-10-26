[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [database/src/sqlite/SQLiteService](../README.md) / SQLiteService

# Class: SQLiteService

Defined in: [packages/database/src/sqlite/SQLiteService.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L15)

## Constructors

### Constructor

> **new SQLiteService**(`adapter?`): `SQLiteService`

Defined in: [packages/database/src/sqlite/SQLiteService.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L24)

#### Parameters

##### adapter?

[`SQLiteAdapter`](../../../adapters/SQLiteAdapter/classes/SQLiteAdapter.md)

#### Returns

`SQLiteService`

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L31)

Initialize the database service

#### Returns

`Promise`\<`void`\>

***

### getTasks()

> **getTasks**(): `Promise`\<`Task`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:67](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L67)

Get all tasks

#### Returns

`Promise`\<`Task`[]\>

***

### getTask()

> **getTask**(`id`): `Promise`\<`Task` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:75](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L75)

Get task by ID

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`Task` \| `null`\>

***

### createTask()

> **createTask**(`task`): `Promise`\<`Task`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:83](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L83)

Create a new task

#### Parameters

##### task

`Omit`\<`Task`, `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<`Task`\>

***

### createTaskWithId()

> **createTaskWithId**(`task`): `Promise`\<`Task`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:91](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L91)

Create a task with a specific ID (used by middleware to preserve Redux IDs)

#### Parameters

##### task

`Task`

#### Returns

`Promise`\<`Task`\>

***

### updateTask()

> **updateTask**(`id`, `updates`): `Promise`\<`Task` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:99](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L99)

Update a task

#### Parameters

##### id

`string`

##### updates

`Partial`\<`Task`\>

#### Returns

`Promise`\<`Task` \| `null`\>

***

### deleteTask()

> **deleteTask**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:107](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L107)

Delete a task

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getTasksByProject()

> **getTasksByProject**(`projectId`): `Promise`\<`Task`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:115](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L115)

Get tasks by project

#### Parameters

##### projectId

`string`

#### Returns

`Promise`\<`Task`[]\>

***

### searchTasks()

> **searchTasks**(`query`): `Promise`\<`Task`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:123](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L123)

Search tasks

#### Parameters

##### query

`string`

#### Returns

`Promise`\<`Task`[]\>

***

### getTasksDueToday()

> **getTasksDueToday**(): `Promise`\<`Task`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:131](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L131)

Get tasks due today

#### Returns

`Promise`\<`Task`[]\>

***

### getOverdueTasks()

> **getOverdueTasks**(): `Promise`\<`Task`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:139](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L139)

Get overdue tasks

#### Returns

`Promise`\<`Task`[]\>

***

### getProjects()

> **getProjects**(): `Promise`\<`Project`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:149](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L149)

Get all projects

#### Returns

`Promise`\<`Project`[]\>

***

### getActiveProjects()

> **getActiveProjects**(): `Promise`\<`Project`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:157](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L157)

Get active projects

#### Returns

`Promise`\<`Project`[]\>

***

### getProject()

> **getProject**(`id`): `Promise`\<`Project` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:165](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L165)

Get project by ID

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`Project` \| `null`\>

***

### addAIInsights()

> **addAIInsights**(`insights`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:172](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L172)

#### Parameters

##### insights

`object`[]

#### Returns

`Promise`\<`void`\>

***

### listAIInsights()

> **listAIInsights**(`limit`): `Promise`\<`AIInsightRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:192](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L192)

#### Parameters

##### limit

`number` = `200`

#### Returns

`Promise`\<`AIInsightRow`[]\>

***

### getRecentAIInsights()

> **getRecentAIInsights**(`limit`): `Promise`\<`AIInsightRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:197](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L197)

#### Parameters

##### limit

`number` = `20`

#### Returns

`Promise`\<`AIInsightRow`[]\>

***

### addAIRecap()

> **addAIRecap**(`recap`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:202](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L202)

#### Parameters

##### recap

###### provider

`string`

###### type

`"weekly"` \| `"monthly"`

###### title

`string`

###### summary

`string`

###### highlights?

`unknown`[]

###### challenges?

`unknown`[]

###### recommendations?

`unknown`[]

###### period

\{ `start`: `string`; `end`: `string`; \}

###### period.start

`string`

###### period.end

`string`

###### metadata?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### listAIRecaps()

> **listAIRecaps**(`limit`): `Promise`\<`AIRecapRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:221](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L221)

#### Parameters

##### limit

`number` = `50`

#### Returns

`Promise`\<`AIRecapRow`[]\>

***

### addAIUsage()

> **addAIUsage**(`entries`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:226](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L226)

#### Parameters

##### entries

`object`[]

#### Returns

`Promise`\<`void`\>

***

### listAIUsage()

> **listAIUsage**(`limit`): `Promise`\<`object`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:231](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L231)

#### Parameters

##### limit

`number` = `500`

#### Returns

`Promise`\<`object`[]\>

***

### updateInsightFeedback()

> **updateInsightFeedback**(`insightId`, `feedback`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:236](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L236)

#### Parameters

##### insightId

`string`

##### feedback

###### userRating?

`number`

###### dismissed?

`boolean`

###### markedHelpful?

`boolean`

###### userNotes?

`string`

#### Returns

`Promise`\<`void`\>

***

### dismissInsight()

> **dismissInsight**(`insightId`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:246](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L246)

#### Parameters

##### insightId

`string`

#### Returns

`Promise`\<`void`\>

***

### getInsightsFiltered()

> **getInsightsFiltered**(`filters`): `Promise`\<`AIInsightRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:251](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L251)

#### Parameters

##### filters

###### category?

`string`

###### type?

`string`

###### dismissed?

`boolean`

###### limit?

`number`

###### offset?

`number`

#### Returns

`Promise`\<`AIInsightRow`[]\>

***

### deleteOldDismissedInsights()

> **deleteOldDismissedInsights**(`daysOld`): `Promise`\<`number`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:262](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L262)

#### Parameters

##### daysOld

`number` = `90`

#### Returns

`Promise`\<`number`\>

***

### updateRecapInteraction()

> **updateRecapInteraction**(`recapId`, `interaction`): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:267](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L267)

#### Parameters

##### recapId

`string`

##### interaction

###### viewed?

`boolean`

###### favorited?

`boolean`

###### exported?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### getRecapsFiltered()

> **getRecapsFiltered**(`filters`): `Promise`\<`AIRecapRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:276](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L276)

#### Parameters

##### filters

###### type?

`"weekly"` \| `"monthly"`

###### favorited?

`boolean`

###### limit?

`number`

###### offset?

`number`

#### Returns

`Promise`\<`AIRecapRow`[]\>

***

### addAnalysisSummary()

> **addAnalysisSummary**(`summary`): `Promise`\<`string`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:288](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L288)

#### Parameters

##### summary

###### summary_text

`string`

###### key_themes?

`string` \| `string`[]

###### tracked_patterns?

`string` \| `unknown`[]

###### user_focus_areas?

`string` \| `string`[]

###### tasks_analyzed?

`number`

###### journals_analyzed?

`number`

###### insights_generated?

`number`

#### Returns

`Promise`\<`string`\>

***

### getRecentAnalysisSummaries()

> **getRecentAnalysisSummaries**(`limit`): `Promise`\<`AnalysisSummaryRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:301](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L301)

#### Parameters

##### limit

`number` = `3`

#### Returns

`Promise`\<`AnalysisSummaryRow`[]\>

***

### getAllAnalysisSummaries()

> **getAllAnalysisSummaries**(`limit`): `Promise`\<`AnalysisSummaryRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:306](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L306)

#### Parameters

##### limit

`number` = `50`

#### Returns

`Promise`\<`AnalysisSummaryRow`[]\>

***

### getAnalysisSummaryById()

> **getAnalysisSummaryById**(`id`): `Promise`\<`AnalysisSummaryRow` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:311](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L311)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`AnalysisSummaryRow` \| `null`\>

***

### deleteOldAnalysisSummaries()

> **deleteOldAnalysisSummaries**(`keepCount`): `Promise`\<`number`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:316](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L316)

#### Parameters

##### keepCount

`number` = `10`

#### Returns

`Promise`\<`number`\>

***

### getAnalysisSummariesByDateRange()

> **getAnalysisSummariesByDateRange**(`startDate`, `endDate`): `Promise`\<`AnalysisSummaryRow`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:321](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L321)

#### Parameters

##### startDate

`string`

##### endDate

`string`

#### Returns

`Promise`\<`AnalysisSummaryRow`[]\>

***

### getGoals()

> **getGoals**(): `Promise`\<`Goal`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:328](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L328)

#### Returns

`Promise`\<`Goal`[]\>

***

### createGoal()

> **createGoal**(`goal`): `Promise`\<`Goal`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:333](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L333)

#### Parameters

##### goal

`Omit`\<`Goal`, `"id"`\>

#### Returns

`Promise`\<`Goal`\>

***

### createGoalWithId()

> **createGoalWithId**(`goal`): `Promise`\<`Goal`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:338](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L338)

#### Parameters

##### goal

`Goal`

#### Returns

`Promise`\<`Goal`\>

***

### updateGoal()

> **updateGoal**(`id`, `updates`): `Promise`\<`Goal` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:343](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L343)

#### Parameters

##### id

`string`

##### updates

`Partial`\<`Goal`\>

#### Returns

`Promise`\<`Goal` \| `null`\>

***

### deleteGoal()

> **deleteGoal**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:348](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L348)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### createProject()

> **createProject**(`project`): `Promise`\<`Project`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:356](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L356)

Create a new project

#### Parameters

##### project

`Omit`\<`Project`, `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<`Project`\>

***

### createProjectWithId()

> **createProjectWithId**(`project`): `Promise`\<`Project`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:364](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L364)

Create a project with a specific ID (used by middleware to preserve Redux IDs)

#### Parameters

##### project

`Project`

#### Returns

`Promise`\<`Project`\>

***

### updateProject()

> **updateProject**(`id`, `updates`): `Promise`\<`Project` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:372](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L372)

Update a project

#### Parameters

##### id

`string`

##### updates

`Partial`\<`Project`\>

#### Returns

`Promise`\<`Project` \| `null`\>

***

### deleteProject()

> **deleteProject**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:380](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L380)

Delete a project

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getProjectsWithTaskCounts()

> **getProjectsWithTaskCounts**(): `Promise`\<`Project` & `object`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:388](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L388)

Get projects with task counts

#### Returns

`Promise`\<`Project` & `object`[]\>

***

### getJournalEntries()

> **getJournalEntries**(): `Promise`\<`JournalEntry`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:398](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L398)

Get all journal entries

#### Returns

`Promise`\<`JournalEntry`[]\>

***

### getJournalEntry()

> **getJournalEntry**(`id`): `Promise`\<`JournalEntry` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:406](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L406)

Get journal entry by ID

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`JournalEntry` \| `null`\>

***

### createJournalEntry()

> **createJournalEntry**(`entry`): `Promise`\<`JournalEntry`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:414](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L414)

Create a new journal entry

#### Parameters

##### entry

`Omit`\<`JournalEntry`, `"id"` \| `"createdAt"` \| `"updatedAt"`\>

#### Returns

`Promise`\<`JournalEntry`\>

***

### createJournalEntryWithId()

> **createJournalEntryWithId**(`entry`): `Promise`\<`JournalEntry`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:422](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L422)

Create a journal entry with a specific ID (used by middleware to preserve Redux IDs)

#### Parameters

##### entry

`JournalEntry`

#### Returns

`Promise`\<`JournalEntry`\>

***

### updateJournalEntry()

> **updateJournalEntry**(`id`, `updates`): `Promise`\<`JournalEntry` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:430](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L430)

Update a journal entry

#### Parameters

##### id

`string`

##### updates

`Partial`\<`JournalEntry`\>

#### Returns

`Promise`\<`JournalEntry` \| `null`\>

***

### deleteJournalEntry()

> **deleteJournalEntry**(`id`): `Promise`\<`boolean`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:438](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L438)

Delete a journal entry

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getJournalEntriesByDate()

> **getJournalEntriesByDate**(`date`): `Promise`\<`JournalEntry`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:446](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L446)

Get entries by date

#### Parameters

##### date

`Date`

#### Returns

`Promise`\<`JournalEntry`[]\>

***

### getPinnedJournalEntries()

> **getPinnedJournalEntries**(): `Promise`\<`JournalEntry`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:454](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L454)

Get pinned entries

#### Returns

`Promise`\<`JournalEntry`[]\>

***

### searchJournalEntries()

> **searchJournalEntries**(`query`): `Promise`\<`JournalEntry`[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:462](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L462)

Search journal entries

#### Parameters

##### query

`string`

#### Returns

`Promise`\<`JournalEntry`[]\>

***

### toggleJournalEntryPin()

> **toggleJournalEntryPin**(`id`): `Promise`\<`JournalEntry` \| `null`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:470](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L470)

Toggle pin status of an entry

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`JournalEntry` \| `null`\>

***

### testConnection()

> **testConnection**(): `Promise`\<`boolean`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:480](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L480)

Test database connection

#### Returns

`Promise`\<`boolean`\>

***

### getStatistics()

> **getStatistics**(): `object`

Defined in: [packages/database/src/sqlite/SQLiteService.ts:491](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L491)

Get database statistics

#### Returns

`object`

##### path

> **path**: `string`

##### size

> **size**: `number`

##### tables

> **tables**: `object`[]

***

### backup()

> **backup**(`backupPath?`): `Promise`\<`string`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:499](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L499)

Create a backup

#### Parameters

##### backupPath?

`string`

#### Returns

`Promise`\<`string`\>

***

### vacuum()

> **vacuum**(): `void`

Defined in: [packages/database/src/sqlite/SQLiteService.ts:507](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L507)

Vacuum the database

#### Returns

`void`

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:515](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L515)

Close the database connection

#### Returns

`Promise`\<`void`\>

***

### transaction()

> **transaction**\<`T`\>(`fn`): `T`

Defined in: [packages/database/src/sqlite/SQLiteService.ts:528](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L528)

Execute a transaction

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

#### Returns

`T`

***

### importFromLocalStorage()

> **importFromLocalStorage**(`data`): `Promise`\<\{ `imported`: `number`; `errors`: `string`[]; \}\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:536](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L536)

Import data from localStorage format

#### Parameters

##### data

###### tasks?

`Task`[]

###### projects?

`Project`[]

###### journalEntries?

`JournalEntry`[]

###### goals?

`Goal`[]

#### Returns

`Promise`\<\{ `imported`: `number`; `errors`: `string`[]; \}\>

***

### exportAllData()

> **exportAllData**(): `Promise`\<\{ `tasks`: `Task`[]; `projects`: `Project`[]; `journalEntries`: `JournalEntry`[]; `goals`: `Goal`[]; \}\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:627](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L627)

Export all data

#### Returns

`Promise`\<\{ `tasks`: `Task`[]; `projects`: `Project`[]; `journalEntries`: `JournalEntry`[]; `goals`: `Goal`[]; \}\>

***

### executeRawQuery()

> **executeRawQuery**(`query`, `params?`): `Promise`\<`Record`\<`string`, `unknown`\>[]\>

Defined in: [packages/database/src/sqlite/SQLiteService.ts:648](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/database/src/sqlite/SQLiteService.ts#L648)

Execute a raw SQL query

#### Parameters

##### query

`string`

##### params?

`unknown`[]

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\>[]\>
