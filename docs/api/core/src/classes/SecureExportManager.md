[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SecureExportManager

# Class: SecureExportManager

Defined in: [packages/core/src/utils/secureExport.ts:107](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L107)

Secure export manager

## Constructors

### Constructor

> **new SecureExportManager**(`password`, `settings`): `SecureExportManager`

Defined in: [packages/core/src/utils/secureExport.ts:111](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L111)

#### Parameters

##### password

`string`

##### settings

[`EnhancedPrivacySecuritySettings`](../interfaces/EnhancedPrivacySecuritySettings.md)

#### Returns

`SecureExportManager`

## Methods

### exportData()

> **exportData**(`data`): `Promise`\<`string`\>

Defined in: [packages/core/src/utils/secureExport.ts:119](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L119)

Export data securely with encryption

#### Parameters

##### data

###### tasks

`any`[]

###### journalEntries

`any`[]

###### projects

`any`[]

###### appSettings

`any`

#### Returns

`Promise`\<`string`\>

***

### importData()

> **importData**(`exportString`): `Promise`\<\{ `tasks`: `any`[]; `journalEntries`: `any`[]; `projects`: `any`[]; `settings`: `any`; `metadata`: \{ `importDate`: `string`; `originalExportDate`: `string`; `itemsDecrypted`: `number`; `checksumValid`: `boolean`; \}; \}\>

Defined in: [packages/core/src/utils/secureExport.ts:173](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureExport.ts#L173)

Import and decrypt data

#### Parameters

##### exportString

`string`

#### Returns

`Promise`\<\{ `tasks`: `any`[]; `journalEntries`: `any`[]; `projects`: `any`[]; `settings`: `any`; `metadata`: \{ `importDate`: `string`; `originalExportDate`: `string`; `itemsDecrypted`: `number`; `checksumValid`: `boolean`; \}; \}\>
