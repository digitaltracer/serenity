[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / SerenityError

# Interface: SerenityError

Defined in: [packages/core/src/utils/errorHandler.ts:51](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L51)

Standardized error interface

## Extends

- `Error`

## Properties

### code

> **code**: `string`

Defined in: [packages/core/src/utils/errorHandler.ts:52](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L52)

***

### category

> **category**: [`ErrorCategory`](../enumerations/ErrorCategory.md)

Defined in: [packages/core/src/utils/errorHandler.ts:53](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L53)

***

### severity

> **severity**: [`ErrorSeverity`](../enumerations/ErrorSeverity.md)

Defined in: [packages/core/src/utils/errorHandler.ts:54](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L54)

***

### context?

> `optional` **context**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/utils/errorHandler.ts:55](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L55)

***

### userMessage?

> `optional` **userMessage**: `string`

Defined in: [packages/core/src/utils/errorHandler.ts:56](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L56)

***

### timestamp

> **timestamp**: `string`

Defined in: [packages/core/src/utils/errorHandler.ts:57](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L57)

***

### stack?

> `optional` **stack**: `string`

Defined in: [packages/core/src/utils/errorHandler.ts:58](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L58)

#### Overrides

`Error.stack`

***

### originalError?

> `optional` **originalError**: `Error`

Defined in: [packages/core/src/utils/errorHandler.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/errorHandler.ts#L59)

***

### name

> **name**: `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.name`

***

### message

> **message**: `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

`Error.message`
