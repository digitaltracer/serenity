[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / validateUser

# Function: validateUser()

> **validateUser**(`data`): `object`

Defined in: [packages/core/src/validation/schemas.ts:122](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/validation/schemas.ts#L122)

## Parameters

### data

`unknown`

## Returns

`object`

### id

> **id**: `string`

### name

> **name**: `string`

### email

> **email**: `string`

### preferences

> **preferences**: `object` = `UserPreferencesSchema`

#### preferences.theme

> **theme**: `"light"` \| `"dark"` \| `"system"`

#### preferences.compactMode

> **compactMode**: `boolean`

#### preferences.notifications

> **notifications**: `object`

#### preferences.notifications.enabled

> **enabled**: `boolean`

#### preferences.notifications.sounds

> **sounds**: `boolean`

#### preferences.notifications.taskReminders

> **taskReminders**: `boolean`

#### preferences.notifications.dailyReview

> **dailyReview**: `boolean`

#### preferences.language

> **language**: `string`

#### preferences.dateFormat

> **dateFormat**: `string`

#### preferences.timeFormat

> **timeFormat**: `"12h"` \| `"24h"`

### createdAt

> **createdAt**: `Date` = `dateSchema`

### updatedAt

> **updatedAt**: `Date` = `dateSchema`
