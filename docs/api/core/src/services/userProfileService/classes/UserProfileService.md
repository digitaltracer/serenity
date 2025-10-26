[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/userProfileService](../README.md) / UserProfileService

# Class: UserProfileService

Defined in: [packages/core/src/services/userProfileService.ts:67](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L67)

## Constructors

### Constructor

> **new UserProfileService**(): `UserProfileService`

#### Returns

`UserProfileService`

## Methods

### buildProfile()

> `static` **buildProfile**(`context`, `existingProfile?`): [`UserProfile`](../interfaces/UserProfile.md)

Defined in: [packages/core/src/services/userProfileService.ts:408](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L408)

Build or update user profile

#### Parameters

##### context

[`ProfileUpdateContext`](../interfaces/ProfileUpdateContext.md)

##### existingProfile?

[`UserProfile`](../interfaces/UserProfile.md)

#### Returns

[`UserProfile`](../interfaces/UserProfile.md)

***

### getFocusAreasSummary()

> `static` **getFocusAreasSummary**(`profile`): `string`

Defined in: [packages/core/src/services/userProfileService.ts:494](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L494)

Get focus areas summary for AI context

#### Parameters

##### profile

[`UserProfile`](../interfaces/UserProfile.md)

#### Returns

`string`
