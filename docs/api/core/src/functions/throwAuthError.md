[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / throwAuthError

# Function: throwAuthError()

> **throwAuthError**(`code`, `originalError?`, `context?`): `never`

Defined in: [packages/core/src/utils/errorHandler.ts:458](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L458)

Create and throw an authentication error

## Parameters

### code

`"AUTH_INVALID_CREDENTIALS"` | `"AUTH_SESSION_EXPIRED"` | `"AUTH_BIOMETRIC_FAILED"` | `"AUTH_PASSWORD_REQUIRED"`

### originalError?

`Error`

### context?

`Record`\<`string`, `any`\>

## Returns

`never`
