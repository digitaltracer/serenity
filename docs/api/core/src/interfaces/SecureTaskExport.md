[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SecureTaskExport

# Interface: SecureTaskExport

Defined in: [packages/core/src/utils/secureExport.ts:51](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L51)

## Properties

### id

> **id**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:52](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L52)

***

### title

> **title**: `string` \| [`EncryptedData`](EncryptedData.md)

Defined in: [packages/core/src/utils/secureExport.ts:53](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L53)

***

### description

> **description**: `string` \| [`EncryptedData`](EncryptedData.md)

Defined in: [packages/core/src/utils/secureExport.ts:54](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L54)

***

### completed

> **completed**: `boolean`

Defined in: [packages/core/src/utils/secureExport.ts:55](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L55)

***

### priority

> **priority**: `"low"` \| `"medium"` \| `"high"`

Defined in: [packages/core/src/utils/secureExport.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L56)

***

### dueDate?

> `optional` **dueDate**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L57)

***

### projectId?

> `optional` **projectId**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:58](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L58)

***

### tags

> **tags**: (`string` \| [`EncryptedData`](EncryptedData.md))[]

Defined in: [packages/core/src/utils/secureExport.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L59)

***

### createdAt

> **createdAt**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:60](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L60)

***

### updatedAt

> **updatedAt**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:61](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L61)

***

### classification

> **classification**: `object`

Defined in: [packages/core/src/utils/secureExport.ts:62](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L62)

#### title

> **title**: [`DataClassification`](../type-aliases/DataClassification.md)

#### description

> **description**: [`DataClassification`](../type-aliases/DataClassification.md)

#### tags

> **tags**: [`DataClassification`](../type-aliases/DataClassification.md)
