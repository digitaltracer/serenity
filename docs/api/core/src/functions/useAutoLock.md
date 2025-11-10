[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / useAutoLock

# Function: useAutoLock()

> **useAutoLock**(): `object`

Defined in: [packages/core/src/utils/useAutoLock.ts:9](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/useAutoLock.ts#L9)

Hook for managing auto-lock functionality
Tracks user activity and automatically locks the app after inactivity

## Returns

`object`

### isLocked

> **isLocked**: `boolean` = `auth.isLocked`

### hasMasterPassword

> **hasMasterPassword**: `boolean` = `auth.hasMasterPassword`

### autoLockTimeout

> **autoLockTimeout**: `number` = `auth.autoLockTimeout`

### lastActivity

> **lastActivity**: `number` = `auth.lastActivity`

### manualLock()

> **manualLock**: () => `object`

#### Returns

`object`

##### payload

> **payload**: `undefined`

##### type

> **type**: `"auth/checkAutoLock"`
