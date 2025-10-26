[**serenity-notes v0.1.0**](../../../README.md)

***

[serenity-notes](../../../README.md) / [core/src](../README.md) / validateSecurityPolicy

# Function: validateSecurityPolicy()

> **validateSecurityPolicy**(`config`): `boolean`

Defined in: [packages/core/src/utils/securityConfig.ts:59](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/utils/securityConfig.ts#L59)

## Parameters

### config

#### PBKDF2_ITERATIONS

`100000` = `100000`

#### PBKDF2_FAST_ITERATIONS

`10000` = `10000`

#### AES

\{ `ALGORITHM`: `"AES-GCM"`; `KEY_LENGTH`: `256`; `IV_LENGTH`: `12`; \} = `...`

#### AES.ALGORITHM

`"AES-GCM"` = `...`

#### AES.KEY_LENGTH

`256` = `256`

#### AES.IV_LENGTH

`12` = `12`

#### SALT_LENGTH

`32` = `32`

#### HASH_ALGORITHM

`"SHA-256"` = `...`

#### KEY_CACHE_TTL

`300000` = `300000`

#### AUTH_TIMEOUT

`30000` = `30000`

#### ENCRYPTED_DATA_PREFIX

`"SRNT_ENC_"` = `'SRNT_ENC_'`

#### VERSION

`"1.0"` = `'1.0'`

## Returns

`boolean`
