[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / throwIntegrationError

# Function: throwIntegrationError()

> **throwIntegrationError**(`code`, `originalError?`, `context?`): `never`

Defined in: [packages/core/src/utils/errorHandler.ts:491](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L491)

Create and throw an integration error

## Parameters

### code

`"INTEGRATION_CONNECTION_FAILED"` | `"INTEGRATION_AUTH_FAILED"` | `"INTEGRATION_SYNC_FAILED"` | `"INTEGRATION_RATE_LIMIT"`

### originalError?

`Error`

### context?

`Record`\<`string`, `any`\>

## Returns

`never`
