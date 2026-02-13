import type { User } from 'hub:db:schema'

interface JWTPayload {
  sub: string
  iss: string
  aud: string | string[]
  exp: number
  iat: number
  scope?: string
  name?: string
  email?: string
  picture?: string
}

interface JWK {
  kty: string
  n: string
  e: string
  alg: string
  use: string
  kid: string
}

// Helper to convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Helper to convert base64url to ArrayBuffer
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Convert PEM to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[^a-zA-Z0-9+/=]/g, '')
  return base64UrlToArrayBuffer(base64.replace(/\+/g, '-').replace(/\//g, '_'))
}

// Import RSA private key from PEM
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem)
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    true,
    ['sign']
  )
}

// Import RSA public key from PEM
async function importPublicKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem)
  return crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    true,
    ['verify']
  )
}

// Generate a signed JWT
async function generateJWT(
  payload: Omit<JWTPayload, 'iat'>,
  privateKeyPem: string
): Promise<string> {
  const privateKey = await importPrivateKey(privateKeyPem)

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'key-1'
  }

  const fullPayload: JWTPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  }

  const encodedHeader = arrayBufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(header)).buffer
  )
  const encodedPayload = arrayBufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(fullPayload)).buffer
  )

  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  )

  const encodedSignature = arrayBufferToBase64Url(signature)
  return `${signatureInput}.${encodedSignature}`
}

// Verify and decode a JWT
export async function verifyJWT(
  token: string,
  publicKeyPem: string,
  options?: { issuer?: string, audience?: string }
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string]

    const publicKey = await importPublicKey(publicKeyPem)

    const signatureInput = `${encodedHeader}.${encodedPayload}`
    const signature = base64UrlToArrayBuffer(encodedSignature)

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature,
      new TextEncoder().encode(signatureInput)
    )

    if (!valid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToArrayBuffer(encodedPayload))
    ) as JWTPayload

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    // Validate issuer
    if (options?.issuer && payload.iss !== options.issuer) {
      return null
    }

    // Validate audience
    if (options?.audience) {
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
      if (!audiences.includes(options.audience)) {
        return null
      }
    }

    return payload
  } catch {
    return null
  }
}

// Generate access token for a user
export async function generateAccessToken(
  user: User,
  clientId: string,
  scope: string,
  issuer: string,
  privateKeyPem: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  return generateJWT(
    {
      sub: user.id,
      iss: issuer,
      aud: clientId,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      scope,
      name: user.name,
      email: user.email,
      picture: user.avatar || undefined
    },
    privateKeyPem
  )
}

// Generate ID token (OpenID Connect)
export async function generateIdToken(
  user: User,
  clientId: string,
  issuer: string,
  privateKeyPem: string,
  nonce?: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const payload: Record<string, unknown> = {
    sub: user.id,
    iss: issuer,
    aud: clientId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    name: user.name,
    email: user.email,
    picture: user.avatar || undefined
  }

  if (nonce) {
    payload.nonce = nonce
  }

  return generateJWT(payload as Omit<JWTPayload, 'iat'>, privateKeyPem)
}

// Export public key as JWK
export async function getJWKS(publicKeyPem: string): Promise<{ keys: JWK[] }> {
  const publicKey = await importPublicKey(publicKeyPem)
  const exported = await crypto.subtle.exportKey('jwk', publicKey)

  return {
    keys: [
      {
        kty: exported.kty || 'RSA',
        n: exported.n || '',
        e: exported.e || '',
        alg: 'RS256',
        use: 'sig',
        kid: 'key-1'
      }
    ]
  }
}
