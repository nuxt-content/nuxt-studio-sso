import { eq, and, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { timingSafeEqual } from 'node:crypto'
import type { OAuthClient, User } from 'hub:db:schema'

// Generate a secure random string
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Generate UUID v4
export function generateUUID(): string {
  return crypto.randomUUID()
}

// Hash a token using SHA-256
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify a token against its hash (constant-time comparison to prevent timing attacks)
export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  const computedHash = await hashToken(token)
  const encoder = new TextEncoder()
  const computedBuffer = encoder.encode(computedHash)
  const hashBuffer = encoder.encode(hash)

  // Ensure buffers are the same length for timing-safe comparison
  if (computedBuffer.length !== hashBuffer.length) {
    return false
  }

  return timingSafeEqual(computedBuffer, hashBuffer)
}

// PKCE: Generate code verifier
export function generateCodeVerifier(): string {
  return generateSecureToken(32)
}

// PKCE: Generate code challenge from verifier
export async function generateCodeChallenge(verifier: string, method: 'S256' | 'plain' = 'S256'): Promise<string> {
  if (method === 'plain') {
    return verifier
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  // Base64url encode
  let binary = ''
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// PKCE: Verify code challenge
export async function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain' = 'S256'
): Promise<boolean> {
  const computed = await generateCodeChallenge(verifier, method)
  const encoder = new TextEncoder()
  return timingSafeEqual(encoder.encode(computed), encoder.encode(challenge))
}

// The standard Nuxt Studio callback path
export const STUDIO_CALLBACK_PATH = '/__nuxt_studio/auth/sso'

/**
 * Validate redirect URI against website URL and optional preview pattern
 * @param redirectUri - The redirect URI from the OAuth request
 * @param websiteUrl - The main website URL (e.g., https://docs.example.com)
 * @param previewUrlPattern - Optional pattern for preview deployments (e.g., https://*.vercel.app)
 */
export function validateRedirectUri(
  redirectUri: string,
  websiteUrl: string,
  previewUrlPattern?: string | null
): boolean {
  // Normalize URLs (remove trailing slashes)
  const normalizedWebsiteUrl = websiteUrl.replace(/\/$/, '')
  const expectedCallbackUrl = `${normalizedWebsiteUrl}${STUDIO_CALLBACK_PATH}`

  // Check exact match with main website URL
  if (redirectUri === expectedCallbackUrl) {
    return true
  }

  // Check preview URL pattern if provided
  if (previewUrlPattern) {
    const normalizedPattern = previewUrlPattern.replace(/\/$/, '')

    // Escape special regex characters except *, then replace * with pattern
    const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    const regexPattern = escaped.replace(/\*/g, '[^/]+')
    const expectedPattern = `^${regexPattern}${STUDIO_CALLBACK_PATH.replace(/\//g, '\\/')}$`

    try {
      const regex = new RegExp(expectedPattern)
      if (regex.test(redirectUri)) {
        return true
      }
    } catch {
      console.error('Invalid preview URL pattern:', previewUrlPattern)
    }
  }

  return false
}

/**
 * Build the callback URL from a website URL
 */
export function buildCallbackUrl(websiteUrl: string): string {
  const normalizedUrl = websiteUrl.replace(/\/$/, '')
  return `${normalizedUrl}${STUDIO_CALLBACK_PATH}`
}

// Get OAuth client by ID
export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  const clients = await db
    .select()
    .from(schema.oauthClients)
    .where(and(eq(schema.oauthClients.id, clientId), eq(schema.oauthClients.isActive, true)))
    .limit(1)

  return clients[0] || null
}

// Verify client credentials
export async function verifyClientCredentials(
  clientId: string,
  clientSecret: string
): Promise<OAuthClient | null> {
  const client = await getOAuthClient(clientId)
  if (!client) return null

  const isValid = await verifyTokenHash(clientSecret, client.secretHash)
  return isValid ? client : null
}

// Create authorization code
export async function createAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scope: string,
  codeChallenge?: string,
  codeChallengeMethod?: string
): Promise<string> {
  const code = generateSecureToken(32)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await db.insert(schema.authorizationCodes).values({
    code,
    clientId,
    userId,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
    expiresAt
  })

  return code
}

// Exchange authorization code for user
export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{ user: User, scope: string } | null> {
  // Get and validate the authorization code
  const codes = await db
    .select()
    .from(schema.authorizationCodes)
    .where(eq(schema.authorizationCodes.code, code))
    .limit(1)

  const authCode = codes[0]
  if (!authCode) return null

  // Delete the code immediately (single use)
  await db.delete(schema.authorizationCodes).where(eq(schema.authorizationCodes.code, code))

  // Validate client ID and redirect URI
  if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
    return null
  }

  // Check expiration
  if (new Date() > authCode.expiresAt) {
    return null
  }

  // Verify PKCE if present
  if (authCode.codeChallenge) {
    if (!codeVerifier) return null

    const method = (authCode.codeChallengeMethod as 'S256' | 'plain') || 'S256'
    const valid = await verifyCodeChallenge(codeVerifier, authCode.codeChallenge, method)
    if (!valid) return null
  }

  // Get user
  const userResults = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, authCode.userId))
    .limit(1)

  const user = userResults[0]
  if (!user) return null

  return { user, scope: authCode.scope }
}

// Create refresh token
export async function createRefreshToken(
  clientId: string,
  userId: string,
  scope: string,
  expiresInDays: number = 30
): Promise<string> {
  const token = generateSecureToken(64)
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  await db.insert(schema.refreshTokens).values({
    id: generateUUID(),
    tokenHash,
    clientId,
    userId,
    scope,
    expiresAt
  })

  return token
}

// Exchange refresh token for user
export async function exchangeRefreshToken(
  token: string,
  clientId: string
): Promise<{ user: User, scope: string, tokenId: string } | null> {
  const tokenHash = await hashToken(token)

  // Get and validate the refresh token
  const tokens = await db
    .select()
    .from(schema.refreshTokens)
    .where(
      and(
        eq(schema.refreshTokens.tokenHash, tokenHash),
        eq(schema.refreshTokens.clientId, clientId),
        isNull(schema.refreshTokens.revokedAt)
      )
    )
    .limit(1)

  const refreshToken = tokens[0]
  if (!refreshToken) return null

  // Check expiration
  if (new Date() > refreshToken.expiresAt) {
    return null
  }

  // Get user
  const userResults = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, refreshToken.userId))
    .limit(1)

  const user = userResults[0]
  if (!user) return null

  return { user, scope: refreshToken.scope, tokenId: refreshToken.id }
}

// Revoke refresh token
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const tokenHash = await hashToken(token)

  const result = await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.tokenHash, tokenHash))

  return result.rowsAffected > 0
}

// Revoke all refresh tokens for a user/client combination
export async function revokeAllUserTokens(userId: string, clientId?: string): Promise<void> {
  if (clientId) {
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          eq(schema.refreshTokens.clientId, clientId),
          isNull(schema.refreshTokens.revokedAt)
        )
      )
  } else {
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.refreshTokens.userId, userId), isNull(schema.refreshTokens.revokedAt)))
  }
}

// Clean up expired authorization codes
export async function cleanupExpiredCodes(): Promise<void> {
  const now = new Date()

  await db.delete(schema.authorizationCodes).where(eq(schema.authorizationCodes.expiresAt, now))
}
