/**
 * Client-side encryption utilities using Web Crypto API
 * For end-to-end encryption of user data
 *
 * The user's password never leaves the client - only encrypted data is sent to the server
 */

'use client'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const PBKDF2_ITERATIONS = 100000

export interface EncryptedPayload {
  encrypted: string
  iv: string
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API is not available')
  }

  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const saltBuffer = base64ToBuffer(salt)

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data with a CryptoKey
 */
export async function encrypt(data: string, key: CryptoKey): Promise<EncryptedPayload> {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API is not available')
  }

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataBuffer
  )

  return {
    encrypted: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  }
}

/**
 * Decrypt data with a CryptoKey
 */
export async function decrypt(
  encryptedPayload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API is not available')
  }

  const encryptedBuffer = base64ToBuffer(encryptedPayload.encrypted)
  const ivBuffer = base64ToBuffer(encryptedPayload.iv)

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    encryptedBuffer
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API is not available')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  return bufferToBase64(salt)
}

/**
 * Hash a password for storage (using Web Crypto API)
 * This creates a verification hash that can be stored in the database
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API is not available')
  }

  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password + salt)

  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer)

  return bufferToBase64(hashBuffer)
}

/**
 * Convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Encrypt an object (converts to JSON first)
 */
export async function encryptObject<T>(obj: T, key: CryptoKey): Promise<EncryptedPayload> {
  const json = JSON.stringify(obj)
  return encrypt(json, key)
}

/**
 * Decrypt an object (parses JSON after decryption)
 */
export async function decryptObject<T>(
  encryptedPayload: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const json = await decrypt(encryptedPayload, key)
  return JSON.parse(json)
}

/**
 * Store encryption key in session storage (for the current session only)
 * WARNING: This is stored in memory and will be lost on page refresh
 */
export function storeKeyInSession(key: CryptoKey, userId: string): void {
  // We can't directly store CryptoKey, so we'll need to export and import it
  // For now, we'll rely on keeping it in React state
  // This is a placeholder for future implementation if needed
}

/**
 * Test encryption/decryption
 */
export async function testEncryption(password: string): Promise<boolean> {
  try {
    const salt = generateSalt()
    const key = await deriveKey(password, salt)
    const testData = 'Hello, World!'
    const encrypted = await encrypt(testData, key)
    const decrypted = await decrypt(encrypted, key)
    return decrypted === testData
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}
