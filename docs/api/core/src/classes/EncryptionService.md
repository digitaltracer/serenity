[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / EncryptionService

# Class: EncryptionService

Defined in: [packages/core/src/utils/encryption.ts:101](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L101)

Main encryption service class

## Constructors

### Constructor

> **new EncryptionService**(): `EncryptionService`

#### Returns

`EncryptionService`

## Methods

### deriveKey()

> `static` **deriveKey**(`password`, `salt`, `iterations`): `Promise`\<`CryptoKey`\>

Defined in: [packages/core/src/utils/encryption.ts:109](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L109)

Generate a cryptographic key from a password and salt

#### Parameters

##### password

`string`

##### salt

`Uint8Array`

##### iterations

`number` = `100000`

#### Returns

`Promise`\<`CryptoKey`\>

***

### generateSalt()

> `static` **generateSalt**(): `Uint8Array`

Defined in: [packages/core/src/utils/encryption.ts:140](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L140)

Generate a random salt

#### Returns

`Uint8Array`

***

### generateIV()

> `static` **generateIV**(): `Uint8Array`

Defined in: [packages/core/src/utils/encryption.ts:147](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L147)

Generate a random IV

#### Returns

`Uint8Array`

***

### encrypt()

> `static` **encrypt**(`data`, `password`, `classification`, `keyVersion?`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

Defined in: [packages/core/src/utils/encryption.ts:154](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L154)

Encrypt data using AES-GCM

#### Parameters

##### data

`string`

##### password

`string`

##### classification

[`DataClassification`](../type-aliases/DataClassification.md) = `'confidential'`

##### keyVersion?

`number`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

***

### decrypt()

> `static` **decrypt**(`encryptedData`, `password`, `classification`): `Promise`\<`string`\>

Defined in: [packages/core/src/utils/encryption.ts:206](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L206)

Decrypt data using AES-GCM

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

### encryptJournalEntry()

> `static` **encryptJournalEntry**(`content`, `password`, `settings`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

Defined in: [packages/core/src/utils/encryption.ts:251](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L251)

Encrypt journal entry based on classification settings

#### Parameters

##### content

`string`

##### password

`string`

##### settings

[`ClassificationSettings`](../interfaces/ClassificationSettings.md)

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

***

### encryptTaskData()

> `static` **encryptTaskData**(`data`, `password`, `settings`): `Promise`\<\{ `title?`: [`EncryptedData`](../interfaces/EncryptedData.md); `description?`: [`EncryptedData`](../interfaces/EncryptedData.md); \}\>

Defined in: [packages/core/src/utils/encryption.ts:262](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L262)

Encrypt task data based on classification settings

#### Parameters

##### data

###### title?

`string`

###### description?

`string`

##### password

`string`

##### settings

[`ClassificationSettings`](../interfaces/ClassificationSettings.md)

#### Returns

`Promise`\<\{ `title?`: [`EncryptedData`](../interfaces/EncryptedData.md); `description?`: [`EncryptedData`](../interfaces/EncryptedData.md); \}\>

***

### encryptBulk()

> `static` **encryptBulk**(`items`, `password`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)[]\>

Defined in: [packages/core/src/utils/encryption.ts:283](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L283)

Bulk encrypt multiple items

#### Parameters

##### items

`object`[]

##### password

`string`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)[]\>

***

### decryptBulk()

> `static` **decryptBulk**(`items`, `password`): `Promise`\<`string`[]\>

Defined in: [packages/core/src/utils/encryption.ts:296](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L296)

Bulk decrypt multiple items

#### Parameters

##### items

`object`[]

##### password

`string`

#### Returns

`Promise`\<`string`[]\>

***

### generateSecurePassword()

> `static` **generateSecurePassword**(`length`): `string`

Defined in: [packages/core/src/utils/encryption.ts:309](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L309)

Generate a secure random password

#### Parameters

##### length

`number` = `32`

#### Returns

`string`

***

### deriveExportKey()

> `static` **deriveExportKey**(`password`, `providedSalt?`): `Promise`\<\{ `key`: `string`; `salt`: `string`; \}\>

Defined in: [packages/core/src/utils/encryption.ts:320](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L320)

Derive encryption key for data export
SECURITY FIX: Use random salt instead of fixed salt

#### Parameters

##### password

`string`

##### providedSalt?

`Uint8Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<\{ `key`: `string`; `salt`: `string`; \}\>

***

### secureDelete()

> `static` **secureDelete**(`data`): `void`

Defined in: [packages/core/src/utils/encryption.ts:337](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L337)

Secure data deletion (overwrite memory)
Enhanced to handle passwords and sensitive strings

#### Parameters

##### data

`any`

#### Returns

`void`

***

### secureDeletePassword()

> `static` **secureDeletePassword**(`password`): `void`

Defined in: [packages/core/src/utils/encryption.ts:372](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L372)

Secure clear password from memory (best effort in JavaScript)

#### Parameters

##### password

`string`

#### Returns

`void`

***

### verifyIntegrity()

> `static` **verifyIntegrity**(`encryptedData`, `password`, `classification`): `Promise`\<`boolean`\>

Defined in: [packages/core/src/utils/encryption.ts:406](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L406)

Verify encrypted data integrity

#### Parameters

##### encryptedData

[`EncryptedData`](../interfaces/EncryptedData.md)

##### password

`string`

##### classification

[`DataClassification`](../type-aliases/DataClassification.md)

#### Returns

`Promise`\<`boolean`\>

***

### getEncryptionStrength()

> `static` **getEncryptionStrength**(`classification`): `number`

Defined in: [packages/core/src/utils/encryption.ts:422](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L422)

Get encryption strength score (0-100)

#### Parameters

##### classification

[`DataClassification`](../type-aliases/DataClassification.md)

#### Returns

`number`
