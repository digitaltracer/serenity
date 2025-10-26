[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / EncryptedIntegrationService

# Class: EncryptedIntegrationService

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L21)

Service for managing encrypted integration data storage

## Constructors

### Constructor

> **new EncryptedIntegrationService**(): `EncryptedIntegrationService`

#### Returns

`EncryptedIntegrationService`

## Methods

### saveEncryptedIntegrations()

> `static` **saveEncryptedIntegrations**(`integrationsState`, `masterPassword`): `Promise`\<`void`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:27](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L27)

Encrypt and store integration tokens in database

#### Parameters

##### integrationsState

[`IntegrationsState`](../interfaces/IntegrationsState.md)

##### masterPassword

`string`

#### Returns

`Promise`\<`void`\>

***

### loadEncryptedIntegrations()

> `static` **loadEncryptedIntegrations**(`masterPassword`): `Promise`\<[`IntegrationsState`](../interfaces/IntegrationsState.md) \| `null`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:175](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L175)

Load and decrypt integration tokens from database

#### Parameters

##### masterPassword

`string`

#### Returns

`Promise`\<[`IntegrationsState`](../interfaces/IntegrationsState.md) \| `null`\>

***

### clearStoredIntegrations()

> `static` **clearStoredIntegrations**(): `Promise`\<`void`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:264](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L264)

Clear all stored integration data

#### Returns

`Promise`\<`void`\>

***

### initializeDatabase()

> `static` **initializeDatabase**(): `Promise`\<`void`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:291](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L291)

Initialize database table for encrypted integrations
Creates the table if it doesn't exist for compatibility

#### Returns

`Promise`\<`void`\>

***

### hasEncryptedIntegrations()

> `static` **hasEncryptedIntegrations**(): `Promise`\<`boolean`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:324](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L324)

Check if encrypted integration data exists

#### Returns

`Promise`\<`boolean`\>

***

### migrateToEncryptedStorage()

> `static` **migrateToEncryptedStorage**(`masterPassword`): `Promise`\<`void`\>

Defined in: [packages/core/src/services/encryptedIntegrationService.ts:347](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/encryptedIntegrationService.ts#L347)

Migrate unencrypted data to encrypted storage

#### Parameters

##### masterPassword

`string`

#### Returns

`Promise`\<`void`\>
