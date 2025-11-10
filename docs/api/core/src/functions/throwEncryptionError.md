[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / throwEncryptionError

# Function: throwEncryptionError()

> **throwEncryptionError**(`code`, `originalError?`, `context?`): `never`

Defined in: [packages/core/src/utils/errorHandler.ts:480](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L480)

Create and throw an encryption error

## Parameters

### code

`"CRYPTO_ENCRYPTION_FAILED"` | `"CRYPTO_DECRYPTION_FAILED"` | `"CRYPTO_KEY_GENERATION_FAILED"` | `"CRYPTO_KEY_ROTATION_FAILED"`

### originalError?

`Error`

### context?

`Record`\<`string`, `any`\>

## Returns

`never`
