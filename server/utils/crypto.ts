/**
 * Simple encryption/decryption utilities for storing sensitive tokens
 * Uses AES-GCM with a key derived from the session password
 */

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12

/**
 * Derive an encryption key from the session password
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nuxt-studio-auth-token-encryption'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a token using AES-GCM
 */
export async function encryptToken(token: string, password: string): Promise<string> {
  const key = await deriveKey(password)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(token)
  )

  // Combine IV and encrypted data, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a token using AES-GCM
 */
export async function decryptToken(encryptedToken: string, password: string): Promise<string | null> {
  try {
    const key = await deriveKey(password)

    // Decode base64 and extract IV and encrypted data
    const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0))
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )

    return new TextDecoder().decode(decrypted)
  } catch {
    console.error('Failed to decrypt token')
    return null
  }
}