[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SecureJournalExport

# Interface: SecureJournalExport

Defined in: [packages/core/src/utils/secureExport.ts:69](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L69)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:70](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L70)

***

### title

> **title**: `string` \| [`EncryptedData`](EncryptedData.md)

Defined in: [packages/core/src/utils/secureExport.ts:71](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L71)

***

### content

> **content**: `string` \| [`EncryptedData`](EncryptedData.md)

Defined in: [packages/core/src/utils/secureExport.ts:72](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L72)

***

### mood?

> `optional` **mood**: `"neutral"` \| `"happy"` \| `"sad"` \| `"excited"` \| `"stressed"`

Defined in: [packages/core/src/utils/secureExport.ts:73](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L73)

***

### pinned

> **pinned**: `boolean`

Defined in: [packages/core/src/utils/secureExport.ts:74](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L74)

***

### tags

> **tags**: (`string` \| [`EncryptedData`](EncryptedData.md))[]

Defined in: [packages/core/src/utils/secureExport.ts:75](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L75)

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:76](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L76)

***

### updatedAt

> **updatedAt**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:77](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L77)

***

### classification

> **classification**: `object`

Defined in: [packages/core/src/utils/secureExport.ts:78](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L78)

#### title

> **title**: [`DataClassification`](../type-aliases/DataClassification.md)

#### content

> **content**: [`DataClassification`](../type-aliases/DataClassification.md)

#### tags

> **tags**: [`DataClassification`](../type-aliases/DataClassification.md)
