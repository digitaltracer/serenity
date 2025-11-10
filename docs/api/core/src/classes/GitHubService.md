[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / GitHubService

# Class: GitHubService

Defined in: [packages/core/src/services/githubService.ts:55](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L55)

## Constructors

### Constructor

> **new GitHubService**(): `GitHubService`

#### Returns

`GitHubService`

## Methods

### validateToken()

> `static` **validateToken**(`accessToken`): `Promise`\<\{ `login`: `string`; `name`: `string`; `email`: `string`; \}\>

Defined in: [packages/core/src/services/githubService.ts:61](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L61)

Validate GitHub access token and get user info

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<\{ `login`: `string`; `name`: `string`; `email`: `string`; \}\>

***

### getUserRepositories()

> `static` **getUserRepositories**(`accessToken`): `Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:88](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L88)

Get user's repositories

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

***

### getAllAccessibleRepositories()

> `static` **getAllAccessibleRepositories**(`accessToken`): `Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:108](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L108)

Get all repositories the token has access to (owned + collaborator + organization repos)
This includes ALL repositories where the user can create PRs, not just owned ones

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

***

### getUserOrganizations()

> `static` **getUserOrganizations**(`accessToken`): `Promise`\<`object`[]\>

Defined in: [packages/core/src/services/githubService.ts:206](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L206)

Get user's organizations

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<`object`[]\>

***

### getRecentActiveRepositories()

> `static` **getRecentActiveRepositories**(`accessToken`): `Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:225](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L225)

Get repositories where user has made recent changes (last 10 active)
This is for display purposes in the UI

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<[`GitHubRepository`](../interfaces/GitHubRepository.md)[]\>

***

### getRepositoryCommits()

> `static` **getRepositoryCommits**(`accessToken`, `owner`, `repo`, `since?`, `author?`): `Promise`\<[`GitHubCommit`](../interfaces/GitHubCommit.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:273](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L273)

Get commits for a specific repository since a date

#### Parameters

##### accessToken

`string`

##### owner

`string`

##### repo

`string`

##### since?

`Date`

##### author?

`string`

#### Returns

`Promise`\<[`GitHubCommit`](../interfaces/GitHubCommit.md)[]\>

***

### getRepositoryPullRequests()

> `static` **getRepositoryPullRequests**(`accessToken`, `owner`, `repo`, `state`, `author?`): `Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:316](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L316)

Get pull requests for a specific repository

#### Parameters

##### accessToken

`string`

##### owner

`string`

##### repo

`string`

##### state

`"all"` | `"open"` | `"closed"`

##### author?

`string`

#### Returns

`Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

***

### getAllUserCommits()

> `static` **getAllUserCommits**(`accessToken`, `repositories`, `since?`): `Promise`\<[`GitHubCommit`](../interfaces/GitHubCommit.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:364](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L364)

Get commits across all user's repositories since a date

#### Parameters

##### accessToken

`string`

##### repositories

`string`[]

##### since?

`Date`

#### Returns

`Promise`\<[`GitHubCommit`](../interfaces/GitHubCommit.md)[]\>

***

### getAllUserPullRequests()

> `static` **getAllUserPullRequests**(`accessToken`, `repositories`, `state`): `Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:398](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L398)

Get pull requests across all user's repositories

#### Parameters

##### accessToken

`string`

##### repositories

`string`[]

##### state

`"all"` | `"open"` | `"closed"`

#### Returns

`Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

***

### getActivitySummary()

> `static` **getActivitySummary**(`accessToken`, `repositories`, `since?`): `Promise`\<\{ `commits`: [`GitHubCommit`](../interfaces/GitHubCommit.md)[]; `pullRequests`: [`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]; `totalCommits`: `number`; `totalPullRequests`: `number`; \}\>

Defined in: [packages/core/src/services/githubService.ts:432](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L432)

Get activity summary for the user

#### Parameters

##### accessToken

`string`

##### repositories

`string`[]

##### since?

`Date`

#### Returns

`Promise`\<\{ `commits`: [`GitHubCommit`](../interfaces/GitHubCommit.md)[]; `pullRequests`: [`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]; `totalCommits`: `number`; `totalPullRequests`: `number`; \}\>

***

### getTodaysPullRequestsMultiToken()

> `static` **getTodaysPullRequestsMultiToken**(`tokens`, `startOfDay`, `endOfDay`): `Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:467](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L467)

Get pull requests from today using multiple GitHub tokens
This queries ALL pull requests by the user across all tokens, regardless of repository ownership

#### Parameters

##### tokens

`object`[]

##### startOfDay

`Date`

##### endOfDay

`Date`

#### Returns

`Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

***

### getTodaysPullRequests()

> `static` **getTodaysPullRequests**(`accessToken`, `repositories`, `startOfDay`, `endOfDay`): `Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:530](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L530)

Get pull requests from today only using GitHub GraphQL API (backward compatibility method)
This queries ALL pull requests by the user, regardless of repository ownership

#### Parameters

##### accessToken

`string`

##### repositories

`string`[] | `null`

##### startOfDay

`Date`

##### endOfDay

`Date`

#### Returns

`Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

***

### getTodaysPullRequestsSingleToken()

> `static` **getTodaysPullRequestsSingleToken**(`accessToken`, `repositories`, `startOfDay`, `endOfDay`): `Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

Defined in: [packages/core/src/services/githubService.ts:552](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L552)

Get pull requests from today only using GitHub GraphQL API (single token)
This queries ALL pull requests by the user, regardless of repository ownership

#### Parameters

##### accessToken

`string`

##### repositories

`string`[] | `null`

##### startOfDay

`Date`

##### endOfDay

`Date`

#### Returns

`Promise`\<[`GitHubPullRequest`](../interfaces/GitHubPullRequest.md)[]\>

***

### validateTokens()

> `static` **validateTokens**(`tokens`): `Promise`\<`object`[]\>

Defined in: [packages/core/src/services/githubService.ts:825](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L825)

Validate multiple GitHub tokens and return their info

#### Parameters

##### tokens

`object`[]

#### Returns

`Promise`\<`object`[]\>

***

### getMultiTokenRepositoryStats()

> `static` **getMultiTokenRepositoryStats**(`tokens`): `Promise`\<\{ `totalRepositories`: `number`; `repositoriesByToken`: `object`[]; \}\>

Defined in: [packages/core/src/services/githubService.ts:882](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/githubService.ts#L882)

Get repository statistics for all active tokens

#### Parameters

##### tokens

`object`[]

#### Returns

`Promise`\<\{ `totalRepositories`: `number`; `repositoriesByToken`: `object`[]; \}\>
