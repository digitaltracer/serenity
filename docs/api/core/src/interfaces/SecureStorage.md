[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SecureStorage

# Interface: SecureStorage

Defined in: [packages/core/src/utils/secureStorage.ts:182](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L182)

Secure storage interface

## Methods

### setItem()

> **setItem**(`key`, `value`): `Promise`\<`void`\>

Defined in: [packages/core/src/utils/secureStorage.ts:183](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L183)

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`Promise`\<`void`\>

***

### getItem()

> **getItem**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [packages/core/src/utils/secureStorage.ts:184](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L184)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### removeItem()

> **removeItem**(`key`): `Promise`\<`void`\>

Defined in: [packages/core/src/utils/secureStorage.ts:185](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L185)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/core/src/utils/secureStorage.ts:186](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/secureStorage.ts#L186)

#### Returns

`Promise`\<`void`\>
