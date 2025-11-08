/**
 * Server-side encryption utilities
 * Used for encrypting OAuth tokens and integration credentials
 * Uses the server's ENCRYPTION_KEY (not the user's password)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY

  if (!keyHex) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32'
    )
  }

  const key = Buffer.from(keyHex, 'hex')

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters). Current length: ${key.length} bytes`
    )
  }

  return key
}

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypt text using AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypt text using AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData): string {
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Hash a password using bcrypt (for user encryption passwords)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash data using SHA-256 (for checksums)
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}
