[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / ERROR\_CODES

# Variable: ERROR\_CODES

> `const` **ERROR\_CODES**: `object`

Defined in: [packages/core/src/utils/errorHandler.ts:65](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L65)

Error code definitions with metadata

## Type Declaration

### AUTH\_INVALID\_CREDENTIALS

> `readonly` **AUTH\_INVALID\_CREDENTIALS**: `object`

#### AUTH\_INVALID\_CREDENTIALS.code

> `readonly` **code**: `"AUTH_INVALID_CREDENTIALS"` = `'AUTH_INVALID_CREDENTIALS'`

#### AUTH\_INVALID\_CREDENTIALS.category

> `readonly` **category**: [`AUTHENTICATION`](../enumerations/ErrorCategory.md#authentication) = `ErrorCategory.AUTHENTICATION`

#### AUTH\_INVALID\_CREDENTIALS.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### AUTH\_INVALID\_CREDENTIALS.userMessage

> `readonly` **userMessage**: `"Invalid credentials provided"` = `'Invalid credentials provided'`

### AUTH\_SESSION\_EXPIRED

> `readonly` **AUTH\_SESSION\_EXPIRED**: `object`

#### AUTH\_SESSION\_EXPIRED.code

> `readonly` **code**: `"AUTH_SESSION_EXPIRED"` = `'AUTH_SESSION_EXPIRED'`

#### AUTH\_SESSION\_EXPIRED.category

> `readonly` **category**: [`AUTHENTICATION`](../enumerations/ErrorCategory.md#authentication) = `ErrorCategory.AUTHENTICATION`

#### AUTH\_SESSION\_EXPIRED.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### AUTH\_SESSION\_EXPIRED.userMessage

> `readonly` **userMessage**: `"Your session has expired. Please log in again."` = `'Your session has expired. Please log in again.'`

### AUTH\_BIOMETRIC\_FAILED

> `readonly` **AUTH\_BIOMETRIC\_FAILED**: `object`

#### AUTH\_BIOMETRIC\_FAILED.code

> `readonly` **code**: `"AUTH_BIOMETRIC_FAILED"` = `'AUTH_BIOMETRIC_FAILED'`

#### AUTH\_BIOMETRIC\_FAILED.category

> `readonly` **category**: [`AUTHENTICATION`](../enumerations/ErrorCategory.md#authentication) = `ErrorCategory.AUTHENTICATION`

#### AUTH\_BIOMETRIC\_FAILED.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### AUTH\_BIOMETRIC\_FAILED.userMessage

> `readonly` **userMessage**: `"Biometric authentication failed"` = `'Biometric authentication failed'`

### AUTH\_PASSWORD\_REQUIRED

> `readonly` **AUTH\_PASSWORD\_REQUIRED**: `object`

#### AUTH\_PASSWORD\_REQUIRED.code

> `readonly` **code**: `"AUTH_PASSWORD_REQUIRED"` = `'AUTH_PASSWORD_REQUIRED'`

#### AUTH\_PASSWORD\_REQUIRED.category

> `readonly` **category**: [`AUTHENTICATION`](../enumerations/ErrorCategory.md#authentication) = `ErrorCategory.AUTHENTICATION`

#### AUTH\_PASSWORD\_REQUIRED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### AUTH\_PASSWORD\_REQUIRED.userMessage

> `readonly` **userMessage**: `"Master password is required for this operation"` = `'Master password is required for this operation'`

### CRYPTO\_ENCRYPTION\_FAILED

> `readonly` **CRYPTO\_ENCRYPTION\_FAILED**: `object`

#### CRYPTO\_ENCRYPTION\_FAILED.code

> `readonly` **code**: `"CRYPTO_ENCRYPTION_FAILED"` = `'CRYPTO_ENCRYPTION_FAILED'`

#### CRYPTO\_ENCRYPTION\_FAILED.category

> `readonly` **category**: [`ENCRYPTION`](../enumerations/ErrorCategory.md#encryption) = `ErrorCategory.ENCRYPTION`

#### CRYPTO\_ENCRYPTION\_FAILED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### CRYPTO\_ENCRYPTION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to encrypt data"` = `'Failed to encrypt data'`

### CRYPTO\_DECRYPTION\_FAILED

> `readonly` **CRYPTO\_DECRYPTION\_FAILED**: `object`

#### CRYPTO\_DECRYPTION\_FAILED.code

> `readonly` **code**: `"CRYPTO_DECRYPTION_FAILED"` = `'CRYPTO_DECRYPTION_FAILED'`

#### CRYPTO\_DECRYPTION\_FAILED.category

> `readonly` **category**: [`ENCRYPTION`](../enumerations/ErrorCategory.md#encryption) = `ErrorCategory.ENCRYPTION`

#### CRYPTO\_DECRYPTION\_FAILED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### CRYPTO\_DECRYPTION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to decrypt data"` = `'Failed to decrypt data'`

### CRYPTO\_KEY\_GENERATION\_FAILED

> `readonly` **CRYPTO\_KEY\_GENERATION\_FAILED**: `object`

#### CRYPTO\_KEY\_GENERATION\_FAILED.code

> `readonly` **code**: `"CRYPTO_KEY_GENERATION_FAILED"` = `'CRYPTO_KEY_GENERATION_FAILED'`

#### CRYPTO\_KEY\_GENERATION\_FAILED.category

> `readonly` **category**: [`ENCRYPTION`](../enumerations/ErrorCategory.md#encryption) = `ErrorCategory.ENCRYPTION`

#### CRYPTO\_KEY\_GENERATION\_FAILED.severity

> `readonly` **severity**: [`CRITICAL`](../enumerations/ErrorSeverity.md#critical) = `ErrorSeverity.CRITICAL`

#### CRYPTO\_KEY\_GENERATION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to generate encryption key"` = `'Failed to generate encryption key'`

### CRYPTO\_KEY\_ROTATION\_FAILED

> `readonly` **CRYPTO\_KEY\_ROTATION\_FAILED**: `object`

#### CRYPTO\_KEY\_ROTATION\_FAILED.code

> `readonly` **code**: `"CRYPTO_KEY_ROTATION_FAILED"` = `'CRYPTO_KEY_ROTATION_FAILED'`

#### CRYPTO\_KEY\_ROTATION\_FAILED.category

> `readonly` **category**: [`ENCRYPTION`](../enumerations/ErrorCategory.md#encryption) = `ErrorCategory.ENCRYPTION`

#### CRYPTO\_KEY\_ROTATION\_FAILED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### CRYPTO\_KEY\_ROTATION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to rotate encryption key"` = `'Failed to rotate encryption key'`

### DB\_CONNECTION\_FAILED

> `readonly` **DB\_CONNECTION\_FAILED**: `object`

#### DB\_CONNECTION\_FAILED.code

> `readonly` **code**: `"DB_CONNECTION_FAILED"` = `'DB_CONNECTION_FAILED'`

#### DB\_CONNECTION\_FAILED.category

> `readonly` **category**: [`DATABASE`](../enumerations/ErrorCategory.md#database) = `ErrorCategory.DATABASE`

#### DB\_CONNECTION\_FAILED.severity

> `readonly` **severity**: [`CRITICAL`](../enumerations/ErrorSeverity.md#critical) = `ErrorSeverity.CRITICAL`

#### DB\_CONNECTION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to connect to database"` = `'Failed to connect to database'`

### DB\_QUERY\_FAILED

> `readonly` **DB\_QUERY\_FAILED**: `object`

#### DB\_QUERY\_FAILED.code

> `readonly` **code**: `"DB_QUERY_FAILED"` = `'DB_QUERY_FAILED'`

#### DB\_QUERY\_FAILED.category

> `readonly` **category**: [`DATABASE`](../enumerations/ErrorCategory.md#database) = `ErrorCategory.DATABASE`

#### DB\_QUERY\_FAILED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### DB\_QUERY\_FAILED.userMessage

> `readonly` **userMessage**: `"Database operation failed"` = `'Database operation failed'`

### DB\_MIGRATION\_FAILED

> `readonly` **DB\_MIGRATION\_FAILED**: `object`

#### DB\_MIGRATION\_FAILED.code

> `readonly` **code**: `"DB_MIGRATION_FAILED"` = `'DB_MIGRATION_FAILED'`

#### DB\_MIGRATION\_FAILED.category

> `readonly` **category**: [`DATABASE`](../enumerations/ErrorCategory.md#database) = `ErrorCategory.DATABASE`

#### DB\_MIGRATION\_FAILED.severity

> `readonly` **severity**: [`CRITICAL`](../enumerations/ErrorSeverity.md#critical) = `ErrorSeverity.CRITICAL`

#### DB\_MIGRATION\_FAILED.userMessage

> `readonly` **userMessage**: `"Database migration failed"` = `'Database migration failed'`

### DB\_BACKUP\_FAILED

> `readonly` **DB\_BACKUP\_FAILED**: `object`

#### DB\_BACKUP\_FAILED.code

> `readonly` **code**: `"DB_BACKUP_FAILED"` = `'DB_BACKUP_FAILED'`

#### DB\_BACKUP\_FAILED.category

> `readonly` **category**: [`DATABASE`](../enumerations/ErrorCategory.md#database) = `ErrorCategory.DATABASE`

#### DB\_BACKUP\_FAILED.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### DB\_BACKUP\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to create database backup"` = `'Failed to create database backup'`

### VALIDATION\_REQUIRED\_FIELD

> `readonly` **VALIDATION\_REQUIRED\_FIELD**: `object`

#### VALIDATION\_REQUIRED\_FIELD.code

> `readonly` **code**: `"VALIDATION_REQUIRED_FIELD"` = `'VALIDATION_REQUIRED_FIELD'`

#### VALIDATION\_REQUIRED\_FIELD.category

> `readonly` **category**: [`VALIDATION`](../enumerations/ErrorCategory.md#validation) = `ErrorCategory.VALIDATION`

#### VALIDATION\_REQUIRED\_FIELD.severity

> `readonly` **severity**: [`LOW`](../enumerations/ErrorSeverity.md#low) = `ErrorSeverity.LOW`

#### VALIDATION\_REQUIRED\_FIELD.userMessage

> `readonly` **userMessage**: `"Required field is missing"` = `'Required field is missing'`

### VALIDATION\_INVALID\_FORMAT

> `readonly` **VALIDATION\_INVALID\_FORMAT**: `object`

#### VALIDATION\_INVALID\_FORMAT.code

> `readonly` **code**: `"VALIDATION_INVALID_FORMAT"` = `'VALIDATION_INVALID_FORMAT'`

#### VALIDATION\_INVALID\_FORMAT.category

> `readonly` **category**: [`VALIDATION`](../enumerations/ErrorCategory.md#validation) = `ErrorCategory.VALIDATION`

#### VALIDATION\_INVALID\_FORMAT.severity

> `readonly` **severity**: [`LOW`](../enumerations/ErrorSeverity.md#low) = `ErrorSeverity.LOW`

#### VALIDATION\_INVALID\_FORMAT.userMessage

> `readonly` **userMessage**: `"Invalid data format"` = `'Invalid data format'`

### VALIDATION\_OUT\_OF\_RANGE

> `readonly` **VALIDATION\_OUT\_OF\_RANGE**: `object`

#### VALIDATION\_OUT\_OF\_RANGE.code

> `readonly` **code**: `"VALIDATION_OUT_OF_RANGE"` = `'VALIDATION_OUT_OF_RANGE'`

#### VALIDATION\_OUT\_OF\_RANGE.category

> `readonly` **category**: [`VALIDATION`](../enumerations/ErrorCategory.md#validation) = `ErrorCategory.VALIDATION`

#### VALIDATION\_OUT\_OF\_RANGE.severity

> `readonly` **severity**: [`LOW`](../enumerations/ErrorSeverity.md#low) = `ErrorSeverity.LOW`

#### VALIDATION\_OUT\_OF\_RANGE.userMessage

> `readonly` **userMessage**: `"Value is out of acceptable range"` = `'Value is out of acceptable range'`

### INTEGRATION\_CONNECTION\_FAILED

> `readonly` **INTEGRATION\_CONNECTION\_FAILED**: `object`

#### INTEGRATION\_CONNECTION\_FAILED.code

> `readonly` **code**: `"INTEGRATION_CONNECTION_FAILED"` = `'INTEGRATION_CONNECTION_FAILED'`

#### INTEGRATION\_CONNECTION\_FAILED.category

> `readonly` **category**: [`INTEGRATION`](../enumerations/ErrorCategory.md#integration) = `ErrorCategory.INTEGRATION`

#### INTEGRATION\_CONNECTION\_FAILED.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### INTEGRATION\_CONNECTION\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to connect to external service"` = `'Failed to connect to external service'`

### INTEGRATION\_AUTH\_FAILED

> `readonly` **INTEGRATION\_AUTH\_FAILED**: `object`

#### INTEGRATION\_AUTH\_FAILED.code

> `readonly` **code**: `"INTEGRATION_AUTH_FAILED"` = `'INTEGRATION_AUTH_FAILED'`

#### INTEGRATION\_AUTH\_FAILED.category

> `readonly` **category**: [`INTEGRATION`](../enumerations/ErrorCategory.md#integration) = `ErrorCategory.INTEGRATION`

#### INTEGRATION\_AUTH\_FAILED.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### INTEGRATION\_AUTH\_FAILED.userMessage

> `readonly` **userMessage**: `"Authentication with external service failed"` = `'Authentication with external service failed'`

### INTEGRATION\_SYNC\_FAILED

> `readonly` **INTEGRATION\_SYNC\_FAILED**: `object`

#### INTEGRATION\_SYNC\_FAILED.code

> `readonly` **code**: `"INTEGRATION_SYNC_FAILED"` = `'INTEGRATION_SYNC_FAILED'`

#### INTEGRATION\_SYNC\_FAILED.category

> `readonly` **category**: [`INTEGRATION`](../enumerations/ErrorCategory.md#integration) = `ErrorCategory.INTEGRATION`

#### INTEGRATION\_SYNC\_FAILED.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### INTEGRATION\_SYNC\_FAILED.userMessage

> `readonly` **userMessage**: `"Failed to sync with external service"` = `'Failed to sync with external service'`

### INTEGRATION\_RATE\_LIMIT

> `readonly` **INTEGRATION\_RATE\_LIMIT**: `object`

#### INTEGRATION\_RATE\_LIMIT.code

> `readonly` **code**: `"INTEGRATION_RATE_LIMIT"` = `'INTEGRATION_RATE_LIMIT'`

#### INTEGRATION\_RATE\_LIMIT.category

> `readonly` **category**: [`INTEGRATION`](../enumerations/ErrorCategory.md#integration) = `ErrorCategory.INTEGRATION`

#### INTEGRATION\_RATE\_LIMIT.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### INTEGRATION\_RATE\_LIMIT.userMessage

> `readonly` **userMessage**: `"Rate limit exceeded for external service"` = `'Rate limit exceeded for external service'`

### NETWORK\_TIMEOUT

> `readonly` **NETWORK\_TIMEOUT**: `object`

#### NETWORK\_TIMEOUT.code

> `readonly` **code**: `"NETWORK_TIMEOUT"` = `'NETWORK_TIMEOUT'`

#### NETWORK\_TIMEOUT.category

> `readonly` **category**: [`NETWORK`](../enumerations/ErrorCategory.md#network) = `ErrorCategory.NETWORK`

#### NETWORK\_TIMEOUT.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### NETWORK\_TIMEOUT.userMessage

> `readonly` **userMessage**: `"Network request timed out"` = `'Network request timed out'`

### NETWORK\_OFFLINE

> `readonly` **NETWORK\_OFFLINE**: `object`

#### NETWORK\_OFFLINE.code

> `readonly` **code**: `"NETWORK_OFFLINE"` = `'NETWORK_OFFLINE'`

#### NETWORK\_OFFLINE.category

> `readonly` **category**: [`NETWORK`](../enumerations/ErrorCategory.md#network) = `ErrorCategory.NETWORK`

#### NETWORK\_OFFLINE.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### NETWORK\_OFFLINE.userMessage

> `readonly` **userMessage**: `"No internet connection available"` = `'No internet connection available'`

### CONFIG\_INVALID

> `readonly` **CONFIG\_INVALID**: `object`

#### CONFIG\_INVALID.code

> `readonly` **code**: `"CONFIG_INVALID"` = `'CONFIG_INVALID'`

#### CONFIG\_INVALID.category

> `readonly` **category**: [`CONFIGURATION`](../enumerations/ErrorCategory.md#configuration) = `ErrorCategory.CONFIGURATION`

#### CONFIG\_INVALID.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### CONFIG\_INVALID.userMessage

> `readonly` **userMessage**: `"Invalid configuration detected"` = `'Invalid configuration detected'`

### CONFIG\_MISSING

> `readonly` **CONFIG\_MISSING**: `object`

#### CONFIG\_MISSING.code

> `readonly` **code**: `"CONFIG_MISSING"` = `'CONFIG_MISSING'`

#### CONFIG\_MISSING.category

> `readonly` **category**: [`CONFIGURATION`](../enumerations/ErrorCategory.md#configuration) = `ErrorCategory.CONFIGURATION`

#### CONFIG\_MISSING.severity

> `readonly` **severity**: [`HIGH`](../enumerations/ErrorSeverity.md#high) = `ErrorSeverity.HIGH`

#### CONFIG\_MISSING.userMessage

> `readonly` **userMessage**: `"Required configuration is missing"` = `'Required configuration is missing'`

### UNKNOWN\_ERROR

> `readonly` **UNKNOWN\_ERROR**: `object`

#### UNKNOWN\_ERROR.code

> `readonly` **code**: `"UNKNOWN_ERROR"` = `'UNKNOWN_ERROR'`

#### UNKNOWN\_ERROR.category

> `readonly` **category**: [`UNKNOWN`](../enumerations/ErrorCategory.md#unknown) = `ErrorCategory.UNKNOWN`

#### UNKNOWN\_ERROR.severity

> `readonly` **severity**: [`MEDIUM`](../enumerations/ErrorSeverity.md#medium) = `ErrorSeverity.MEDIUM`

#### UNKNOWN\_ERROR.userMessage

> `readonly` **userMessage**: `"An unexpected error occurred"` = `'An unexpected error occurred'`
