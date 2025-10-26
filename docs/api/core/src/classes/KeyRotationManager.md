[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / KeyRotationManager

# Class: KeyRotationManager

Defined in: [packages/core/src/utils/encryption.ts:436](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L436)

Key Rotation Manager
Handles encryption key lifecycle and rotation

## Constructors

### Constructor

> **new KeyRotationManager**(`config`): `KeyRotationManager`

Defined in: [packages/core/src/utils/encryption.ts:441](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L441)

#### Parameters

##### config

[`KeyRotationConfig`](../interfaces/KeyRotationConfig.md) = `DEFAULT_KEY_ROTATION`

#### Returns

`KeyRotationManager`

## Methods

### getCurrentVersion()

> **getCurrentVersion**(): `number`

Defined in: [packages/core/src/utils/encryption.ts:471](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L471)

Get current active key version

#### Returns

`number`

***

### getKeyVersionInfo()

> **getKeyVersionInfo**(`version`): [`KeyVersionInfo`](../interfaces/KeyVersionInfo.md) \| `undefined`

Defined in: [packages/core/src/utils/encryption.ts:478](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L478)

Get key version info

#### Parameters

##### version

`number`

#### Returns

[`KeyVersionInfo`](../interfaces/KeyVersionInfo.md) \| `undefined`

***

### getAllVersions()

> **getAllVersions**(): [`KeyVersionInfo`](../interfaces/KeyVersionInfo.md)[]

Defined in: [packages/core/src/utils/encryption.ts:485](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L485)

Get all key versions

#### Returns

[`KeyVersionInfo`](../interfaces/KeyVersionInfo.md)[]

***

### isRotationNeeded()

> **isRotationNeeded**(): `boolean`

Defined in: [packages/core/src/utils/encryption.ts:492](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L492)

Check if key rotation is needed

#### Returns

`boolean`

***

### isKeyExpired()

> **isKeyExpired**(`version`): `boolean`

Defined in: [packages/core/src/utils/encryption.ts:508](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L508)

Check if key version is expired

#### Parameters

##### version

`number`

#### Returns

`boolean`

***

### rotateKey()

> **rotateKey**(`classification`): `Promise`\<`number`\>

Defined in: [packages/core/src/utils/encryption.ts:522](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L522)

Rotate to a new key version

#### Parameters

##### classification

[`DataClassification`](../type-aliases/DataClassification.md) = `'confidential'`

#### Returns

`Promise`\<`number`\>

***

### encryptWithCurrentKey()

> **encryptWithCurrentKey**(`data`, `password`, `classification`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

Defined in: [packages/core/src/utils/encryption.ts:583](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L583)

Encrypt data with current key version

#### Parameters

##### data

`string`

##### password

`string`

##### classification

[`DataClassification`](../type-aliases/DataClassification.md) = `'confidential'`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

***

### decryptWithKeyVersion()

> **decryptWithKeyVersion**(`encryptedData`, `password`, `classification`): `Promise`\<`string`\>

Defined in: [packages/core/src/utils/encryption.ts:599](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L599)

Decrypt data with appropriate key version

#### Parameters

##### encryptedData

[`EncryptedData`](../interfaces/EncryptedData.md)

##### password

`string`

##### classification

[`DataClassification`](../type-aliases/DataClassification.md) = `'confidential'`

#### Returns

`Promise`\<`string`\>

***

### reencryptData()

> **reencryptData**(`encryptedData`, `password`, `classification`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

Defined in: [packages/core/src/utils/encryption.ts:621](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L621)

Re-encrypt data with current key version

#### Parameters

##### encryptedData

[`EncryptedData`](../interfaces/EncryptedData.md)

##### password

`string`

##### classification

[`DataClassification`](../type-aliases/DataClassification.md) = `'confidential'`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

***

### bulkReencrypt()

> **bulkReencrypt**(`items`, `password`, `onProgress?`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)[]\>

Defined in: [packages/core/src/utils/encryption.ts:636](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L636)

Bulk re-encrypt multiple items to current key version

#### Parameters

##### items

`object`[]

##### password

`string`

##### onProgress?

(`completed`, `total`) => `void`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)[]\>

***

### getRotationStatus()

> **getRotationStatus**(): `object`

Defined in: [packages/core/src/utils/encryption.ts:675](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L675)

Get rotation status and recommendations

#### Returns

`object`

##### currentVersion

> **currentVersion**: `number`

##### rotationNeeded

> **rotationNeeded**: `boolean`

##### daysSinceLastRotation

> **daysSinceLastRotation**: `number`

##### expiredVersions

> **expiredVersions**: `number`[]

##### totalVersions

> **totalVersions**: `number`

##### recommendations

> **recommendations**: `string`[]

***

### updateConfig()

> **updateConfig**(`newConfig`): `void`

Defined in: [packages/core/src/utils/encryption.ts:720](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L720)

Update rotation configuration

#### Parameters

##### newConfig

`Partial`\<[`KeyRotationConfig`](../interfaces/KeyRotationConfig.md)\>

#### Returns

`void`

***

### exportKeyVersions()

> **exportKeyVersions**(): `string`

Defined in: [packages/core/src/utils/encryption.ts:727](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L727)

Export key version metadata for backup

#### Returns

`string`

***

### importKeyVersions()

> **importKeyVersions**(`jsonData`): `void`

Defined in: [packages/core/src/utils/encryption.ts:739](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L739)

Import key version metadata from backup

#### Parameters

##### jsonData

`string`

#### Returns

`void`
