[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / ActionabilityService

# Class: ActionabilityService

Defined in: [packages/core/src/services/actionabilityService.ts:42](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L42)

## Constructors

### Constructor

> **new ActionabilityService**(): `ActionabilityService`

#### Returns

`ActionabilityService`

## Methods

### generateSuggestions()

> `static` **generateSuggestions**(`insight`, `userContext`): [`ActionabilitySuggestion`](../interfaces/ActionabilitySuggestion.md)[]

Defined in: [packages/core/src/services/actionabilityService.ts:46](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L46)

Analyze an insight and generate actionable suggestions

#### Parameters

##### insight

[`AIInsightForActionability`](../interfaces/AIInsightForActionability.md)

##### userContext

###### tasks

[`Task`](../interfaces/Task.md)[]

###### goals

[`Goal`](../interfaces/Goal.md)[]

###### habits?

`any`[]

#### Returns

[`ActionabilitySuggestion`](../interfaces/ActionabilitySuggestion.md)[]

***

### isActionable()

> `static` **isActionable**(`insight`): `boolean`

Defined in: [packages/core/src/services/actionabilityService.ts:90](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L90)

Check if an insight is actionable based on type and content

#### Parameters

##### insight

[`AIInsightForActionability`](../interfaces/AIInsightForActionability.md)

#### Returns

`boolean`

***

### executeSuggestion()

> `static` **executeSuggestion**(`suggestion`, `dispatch`): `Promise`\<\{ `success`: `boolean`; `actionId?`: `string`; `error?`: `string`; \}\>

Defined in: [packages/core/src/services/actionabilityService.ts:121](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/actionabilityService.ts#L121)

Convert a suggestion into a concrete action (e.g., create task)

#### Parameters

##### suggestion

[`ActionabilitySuggestion`](../interfaces/ActionabilitySuggestion.md)

##### dispatch

`ThunkDispatch`\<\{ `tasks`: [`TasksState`](../interfaces/TasksState.md); `projects`: [`ProjectsState`](../interfaces/ProjectsState.md); `journal`: [`JournalState`](../interfaces/JournalState.md); `user`: [`UserState`](../interfaces/UserState.md); `ui`: [`UIState`](../interfaces/UIState.md); `tags`: [`TagsState`](../interfaces/TagsState.md); `auth`: [`AuthState`](../interfaces/AuthState.md); `database`: [`DatabaseState`](../interfaces/DatabaseState.md); `shortcuts`: [`ShortcutsState`](../interfaces/ShortcutsState.md); `search`: [`SearchState`](../interfaces/SearchState.md); `dragDrop`: [`DragDropReduxState`](../interfaces/DragDropReduxState.md); `goals`: [`GoalsState`](../interfaces/GoalsState.md); `integrations`: [`IntegrationsState`](../interfaces/IntegrationsState.md); `aiAssistant`: [`AIAssistantState`](../interfaces/AIAssistantState.md); `insights`: [`InsightsState`](../interfaces/InsightsState.md); \}, `undefined`, `AnyAction`\> & `Dispatch`\<`AnyAction`\>

#### Returns

`Promise`\<\{ `success`: `boolean`; `actionId?`: `string`; `error?`: `string`; \}\>
