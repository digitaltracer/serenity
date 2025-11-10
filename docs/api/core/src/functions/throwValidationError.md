[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / throwValidationError

# Function: throwValidationError()

> **throwValidationError**(`code`, `originalError?`, `context?`): `never`

Defined in: [packages/core/src/utils/errorHandler.ts:502](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L502)

Create and throw a validation error

## Parameters

### code

`"VALIDATION_REQUIRED_FIELD"` | `"VALIDATION_INVALID_FORMAT"` | `"VALIDATION_OUT_OF_RANGE"`

### originalError?

`Error`

### context?

`Record`\<`string`, `any`\>

## Returns

`never`
