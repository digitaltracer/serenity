[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / DataClassificationManager

# Class: DataClassificationManager

Defined in: [packages/core/src/utils/encryption.ts:750](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L750)

Data classification manager

## Constructors

### Constructor

> **new DataClassificationManager**(`settings`): `DataClassificationManager`

Defined in: [packages/core/src/utils/encryption.ts:753](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L753)

#### Parameters

##### settings

[`ClassificationSettings`](../interfaces/ClassificationSettings.md) = `DEFAULT_CLASSIFICATION`

#### Returns

`DataClassificationManager`

## Methods

### updateSettings()

> **updateSettings**(`newSettings`): `void`

Defined in: [packages/core/src/utils/encryption.ts:760](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L760)

Update classification settings

#### Parameters

##### newSettings

`Partial`\<[`ClassificationSettings`](../interfaces/ClassificationSettings.md)\>

#### Returns

`void`

***

### getSettings()

> **getSettings**(): [`ClassificationSettings`](../interfaces/ClassificationSettings.md)

Defined in: [packages/core/src/utils/encryption.ts:767](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L767)

Get current settings

#### Returns

[`ClassificationSettings`](../interfaces/ClassificationSettings.md)

***

### getClassification()

> **getClassification**(`dataType`): [`DataClassification`](../type-aliases/DataClassification.md)

Defined in: [packages/core/src/utils/encryption.ts:774](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L774)

Get classification for specific data type

#### Parameters

##### dataType

keyof [`ClassificationSettings`](../interfaces/ClassificationSettings.md)

#### Returns

[`DataClassification`](../type-aliases/DataClassification.md)

***

### shouldEncrypt()

> **shouldEncrypt**(`dataType`): `boolean`

Defined in: [packages/core/src/utils/encryption.ts:781](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L781)

Check if data type should be encrypted

#### Parameters

##### dataType

keyof [`ClassificationSettings`](../interfaces/ClassificationSettings.md)

#### Returns

`boolean`

***

### getEncryptionStrength()

> **getEncryptionStrength**(`dataType`): `number`

Defined in: [packages/core/src/utils/encryption.ts:789](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L789)

Get encryption strength for data type

#### Parameters

##### dataType

keyof [`ClassificationSettings`](../interfaces/ClassificationSettings.md)

#### Returns

`number`

***

### getSecuritySummary()

> **getSecuritySummary**(): `object`

Defined in: [packages/core/src/utils/encryption.ts:797](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/encryption.ts#L797)

Get security summary

#### Returns

`object`

##### totalDataTypes

> **totalDataTypes**: `number`

##### encryptedDataTypes

> **encryptedDataTypes**: `number`

##### averageStrength

> **averageStrength**: `number`

##### classifications

> **classifications**: `Record`\<[`DataClassification`](../type-aliases/DataClassification.md), `number`\>
