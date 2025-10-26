[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / IntegrationSyncService

# Class: IntegrationSyncService

Defined in: [packages/core/src/services/integrationSyncService.ts:19](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L19)

## Constructors

### Constructor

> **new IntegrationSyncService**(): `IntegrationSyncService`

#### Returns

`IntegrationSyncService`

## Methods

### syncGoogleCalendarEvents()

> `static` **syncGoogleCalendarEvents**(`accessToken`, `existingTasks`, `dateRange`, `connectionDate?`): `Promise`\<\{ `tasks`: [`Task`](../interfaces/Task.md)[]; `result`: [`SyncResult`](../interfaces/SyncResult.md); \}\>

Defined in: [packages/core/src/services/integrationSyncService.ts:23](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L23)

Sync Google Calendar events to tasks

#### Parameters

##### accessToken

`string`

##### existingTasks

[`Task`](../interfaces/Task.md)[]

##### dateRange

###### start

`Date`

###### end

`Date`

##### connectionDate?

`string`

#### Returns

`Promise`\<\{ `tasks`: [`Task`](../interfaces/Task.md)[]; `result`: [`SyncResult`](../interfaces/SyncResult.md); \}\>

***

### syncGitHubActivity()

> `static` **syncGitHubActivity**(`accessToken`, `repositories`, `existingTasks`, `existingProjects`, `since?`): `Promise`\<\{ `tasks`: [`Task`](../interfaces/Task.md)[]; `result`: [`SyncResult`](../interfaces/SyncResult.md); `githubProjectId?`: `string`; \}\>

Defined in: [packages/core/src/services/integrationSyncService.ts:106](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L106)

Sync GitHub Pull Requests from today only (across ALL user repositories)

#### Parameters

##### accessToken

`string`

##### repositories

`string`[]

##### existingTasks

[`Task`](../interfaces/Task.md)[]

##### existingProjects

`any`[]

##### since?

`Date`

#### Returns

`Promise`\<\{ `tasks`: [`Task`](../interfaces/Task.md)[]; `result`: [`SyncResult`](../interfaces/SyncResult.md); `githubProjectId?`: `string`; \}\>

***

### getDefaultSyncDateRange()

> `static` **getDefaultSyncDateRange**(`days`): `object`

Defined in: [packages/core/src/services/integrationSyncService.ts:267](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L267)

Get date range for syncing (e.g., last 30 days)

#### Parameters

##### days

`number` = `30`

#### Returns

`object`

##### start

> **start**: `Date`

##### end

> **end**: `Date`

***

### isIntegrationTask()

> `static` **isIntegrationTask**(`task`): `boolean`

Defined in: [packages/core/src/services/integrationSyncService.ts:278](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L278)

Check if a task is from an integration

#### Parameters

##### task

[`Task`](../interfaces/Task.md)

#### Returns

`boolean`

***

### getIntegrationSource()

> `static` **getIntegrationSource**(`task`): `"github"` \| `"google-calendar"` \| `null`

Defined in: [packages/core/src/services/integrationSyncService.ts:291](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/integrationSyncService.ts#L291)

Get integration source from task tags

#### Parameters

##### task

[`Task`](../interfaces/Task.md)

#### Returns

`"github"` \| `"google-calendar"` \| `null`
