[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / ErrorHandler

# Class: ErrorHandler

Defined in: [packages/core/src/utils/errorHandler.ts:230](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L230)

Error handler class with standardized methods

## Constructors

### Constructor

> **new ErrorHandler**(): `ErrorHandler`

#### Returns

`ErrorHandler`

## Methods

### createError()

> `static` **createError**(`codeKey`, `originalError?`, `context?`, `customUserMessage?`): [`SerenityError`](../interfaces/SerenityError.md)

Defined in: [packages/core/src/utils/errorHandler.ts:237](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L237)

Create a standardized error

#### Parameters

##### codeKey

`"AUTH_INVALID_CREDENTIALS"` | `"AUTH_SESSION_EXPIRED"` | `"AUTH_BIOMETRIC_FAILED"` | `"AUTH_PASSWORD_REQUIRED"` | `"DB_CONNECTION_FAILED"` | `"DB_QUERY_FAILED"` | `"DB_MIGRATION_FAILED"` | `"DB_BACKUP_FAILED"` | `"CRYPTO_ENCRYPTION_FAILED"` | `"CRYPTO_DECRYPTION_FAILED"` | `"CRYPTO_KEY_GENERATION_FAILED"` | `"CRYPTO_KEY_ROTATION_FAILED"` | `"INTEGRATION_CONNECTION_FAILED"` | `"INTEGRATION_AUTH_FAILED"` | `"INTEGRATION_SYNC_FAILED"` | `"INTEGRATION_RATE_LIMIT"` | `"VALIDATION_REQUIRED_FIELD"` | `"VALIDATION_INVALID_FORMAT"` | `"VALIDATION_OUT_OF_RANGE"` | `"NETWORK_TIMEOUT"` | `"NETWORK_OFFLINE"` | `"CONFIG_INVALID"` | `"CONFIG_MISSING"` | `"UNKNOWN_ERROR"`

##### originalError?

`Error`

##### context?

`Record`\<`string`, `any`\>

##### customUserMessage?

`string`

#### Returns

[`SerenityError`](../interfaces/SerenityError.md)

***

### handle()

> `static` **handle**(`error`, `context?`): [`SerenityError`](../interfaces/SerenityError.md)

Defined in: [packages/core/src/utils/errorHandler.ts:264](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L264)

Handle and log an error

#### Parameters

##### error

`Error` | [`SerenityError`](../interfaces/SerenityError.md)

##### context?

`Record`\<`string`, `any`\>

#### Returns

[`SerenityError`](../interfaces/SerenityError.md)

***

### isSerenityError()

> `static` **isSerenityError**(`error`): `error is SerenityError`

Defined in: [packages/core/src/utils/errorHandler.ts:336](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L336)

Check if an error is a SerenityError

#### Parameters

##### error

`any`

#### Returns

`error is SerenityError`

***

### wrapAsync()

> `static` **wrapAsync**\<`T`\>(`fn`, `errorCode`, `context?`): `Promise`\<`T`\>

Defined in: [packages/core/src/utils/errorHandler.ts:347](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L347)

Wrap async functions with error handling

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### errorCode

`"AUTH_INVALID_CREDENTIALS"` | `"AUTH_SESSION_EXPIRED"` | `"AUTH_BIOMETRIC_FAILED"` | `"AUTH_PASSWORD_REQUIRED"` | `"DB_CONNECTION_FAILED"` | `"DB_QUERY_FAILED"` | `"DB_MIGRATION_FAILED"` | `"DB_BACKUP_FAILED"` | `"CRYPTO_ENCRYPTION_FAILED"` | `"CRYPTO_DECRYPTION_FAILED"` | `"CRYPTO_KEY_GENERATION_FAILED"` | `"CRYPTO_KEY_ROTATION_FAILED"` | `"INTEGRATION_CONNECTION_FAILED"` | `"INTEGRATION_AUTH_FAILED"` | `"INTEGRATION_SYNC_FAILED"` | `"INTEGRATION_RATE_LIMIT"` | `"VALIDATION_REQUIRED_FIELD"` | `"VALIDATION_INVALID_FORMAT"` | `"VALIDATION_OUT_OF_RANGE"` | `"NETWORK_TIMEOUT"` | `"NETWORK_OFFLINE"` | `"CONFIG_INVALID"` | `"CONFIG_MISSING"` | `"UNKNOWN_ERROR"`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`T`\>

***

### wrap()

> `static` **wrap**\<`T`\>(`fn`, `errorCode`, `context?`): `T`

Defined in: [packages/core/src/utils/errorHandler.ts:367](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L367)

Wrap synchronous functions with error handling

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

##### errorCode

`"AUTH_INVALID_CREDENTIALS"` | `"AUTH_SESSION_EXPIRED"` | `"AUTH_BIOMETRIC_FAILED"` | `"AUTH_PASSWORD_REQUIRED"` | `"DB_CONNECTION_FAILED"` | `"DB_QUERY_FAILED"` | `"DB_MIGRATION_FAILED"` | `"DB_BACKUP_FAILED"` | `"CRYPTO_ENCRYPTION_FAILED"` | `"CRYPTO_DECRYPTION_FAILED"` | `"CRYPTO_KEY_GENERATION_FAILED"` | `"CRYPTO_KEY_ROTATION_FAILED"` | `"INTEGRATION_CONNECTION_FAILED"` | `"INTEGRATION_AUTH_FAILED"` | `"INTEGRATION_SYNC_FAILED"` | `"INTEGRATION_RATE_LIMIT"` | `"VALIDATION_REQUIRED_FIELD"` | `"VALIDATION_INVALID_FORMAT"` | `"VALIDATION_OUT_OF_RANGE"` | `"NETWORK_TIMEOUT"` | `"NETWORK_OFFLINE"` | `"CONFIG_INVALID"` | `"CONFIG_MISSING"` | `"UNKNOWN_ERROR"`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`T`

***

### getErrorReports()

> `static` **getErrorReports**(`category?`, `severity?`, `limit?`): [`SerenityError`](../interfaces/SerenityError.md)[]

Defined in: [packages/core/src/utils/errorHandler.ts:387](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L387)

Get error reports for debugging

#### Parameters

##### category?

[`ErrorCategory`](../enumerations/ErrorCategory.md)

##### severity?

[`ErrorSeverity`](../enumerations/ErrorSeverity.md)

##### limit?

`number`

#### Returns

[`SerenityError`](../interfaces/SerenityError.md)[]

***

### clearErrorReports()

> `static` **clearErrorReports**(): `void`

Defined in: [packages/core/src/utils/errorHandler.ts:414](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L414)

Clear error reports

#### Returns

`void`

***

### getErrorStats()

> `static` **getErrorStats**(): `object`

Defined in: [packages/core/src/utils/errorHandler.ts:421](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L421)

Get error statistics

#### Returns

`object`

##### totalErrors

> **totalErrors**: `number`

##### bySeverity

> **bySeverity**: `Record`\<[`ErrorSeverity`](../enumerations/ErrorSeverity.md), `number`\>

##### byCategory

> **byCategory**: `Record`\<[`ErrorCategory`](../enumerations/ErrorCategory.md), `number`\>

##### recentErrors

> **recentErrors**: `number`
