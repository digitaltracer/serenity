[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SecureExportData

# Interface: SecureExportData

Defined in: [packages/core/src/utils/secureExport.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L30)

## Properties

### version

> **version**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L31)

***

### exportDate

> **exportDate**: `string`

Defined in: [packages/core/src/utils/secureExport.ts:32](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L32)

***

### encryption

> **encryption**: `object`

Defined in: [packages/core/src/utils/secureExport.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L33)

#### enabled

> **enabled**: `boolean`

#### level

> **level**: `"basic"` \| `"enhanced"` \| `"maximum"`

#### algorithm

> **algorithm**: `string`

***

### metadata

> **metadata**: `object`

Defined in: [packages/core/src/utils/secureExport.ts:38](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L38)

#### totalItems

> **totalItems**: `number`

#### encryptedItems

> **encryptedItems**: `number`

#### checksumHash

> **checksumHash**: `string`

***

### data

> **data**: `object`

Defined in: [packages/core/src/utils/secureExport.ts:43](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L43)

#### tasks

> **tasks**: [`SecureTaskExport`](SecureTaskExport.md)[]

#### journalEntries

> **journalEntries**: [`SecureJournalExport`](SecureJournalExport.md)[]

#### projects

> **projects**: [`SecureProjectExport`](SecureProjectExport.md)[]

#### settings

> **settings**: [`SecureSettingsExport`](SecureSettingsExport.md)
