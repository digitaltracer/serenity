[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / GoogleCalendarService

# Class: GoogleCalendarService

Defined in: [packages/core/src/services/googleCalendarService.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L31)

## Constructors

### Constructor

> **new GoogleCalendarService**(): `GoogleCalendarService`

#### Returns

`GoogleCalendarService`

## Methods

### getAuthUrl()

> `static` **getAuthUrl**(): `string`

Defined in: [packages/core/src/services/googleCalendarService.ts:40](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L40)

Generate Google OAuth URL for authentication

#### Returns

`string`

***

### exchangeCodeForTokens()

> `static` **exchangeCodeForTokens**(`code`): `Promise`\<[`GoogleCalendarAuth`](../interfaces/GoogleCalendarAuth.md)\>

Defined in: [packages/core/src/services/googleCalendarService.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L56)

Exchange authorization code for access and refresh tokens

#### Parameters

##### code

`string`

#### Returns

`Promise`\<[`GoogleCalendarAuth`](../interfaces/GoogleCalendarAuth.md)\>

***

### refreshAccessToken()

> `static` **refreshAccessToken**(`refreshToken`): `Promise`\<\{ `accessToken`: `string`; `expiresAt`: `number`; \}\>

Defined in: [packages/core/src/services/googleCalendarService.ts:86](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L86)

Refresh access token using refresh token

#### Parameters

##### refreshToken

`string`

#### Returns

`Promise`\<\{ `accessToken`: `string`; `expiresAt`: `number`; \}\>

***

### getCalendarEvents()

> `static` **getCalendarEvents**(`accessToken`, `startDate`, `endDate`): `Promise`\<[`GoogleCalendarEvent`](../interfaces/GoogleCalendarEvent.md)[]\>

Defined in: [packages/core/src/services/googleCalendarService.ts:114](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L114)

Get user's primary calendar events for a date range

#### Parameters

##### accessToken

`string`

##### startDate

`Date`

##### endDate

`Date`

#### Returns

`Promise`\<[`GoogleCalendarEvent`](../interfaces/GoogleCalendarEvent.md)[]\>

***

### getCalendarList()

> `static` **getCalendarList**(`accessToken`): `Promise`\<`object`[]\>

Defined in: [packages/core/src/services/googleCalendarService.ts:151](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L151)

Get user's calendar list

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<`object`[]\>

***

### getUserProfile()

> `static` **getUserProfile**(`accessToken`): `Promise`\<\{ `email`: `string`; `name`: `string`; \}\>

Defined in: [packages/core/src/services/googleCalendarService.ts:180](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L180)

Get user profile information

#### Parameters

##### accessToken

`string`

#### Returns

`Promise`\<\{ `email`: `string`; `name`: `string`; \}\>

***

### isTokenExpired()

> `static` **isTokenExpired**(`expiresAt`): `boolean`

Defined in: [packages/core/src/services/googleCalendarService.ts:208](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/googleCalendarService.ts#L208)

Check if access token is expired

#### Parameters

##### expiresAt

`number`

#### Returns

`boolean`
