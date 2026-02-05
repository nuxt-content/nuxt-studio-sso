import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Users table - stores authenticated users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  githubId: text('github_id').unique(),
  githubToken: text('github_token'), // Encrypted GitHub access token for git operations
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false), // Admin flag - first user is admin
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// OAuth Clients table - registered client applications
export const oauthClients = sqliteTable('oauth_clients', {
  id: text('id').primaryKey(), // client_id
  secretHash: text('secret_hash').notNull(),
  name: text('name').notNull(),
  redirectUris: text('redirect_uris').notNull(), // JSON array (auto-generated from websiteUrl/previewUrlPattern)
  websiteUrl: text('website_url').notNull(), // Main website URL (e.g., https://docs.example.com)
  previewUrlPattern: text('preview_url_pattern'), // Optional pattern for preview deployments (e.g., https://*.vercel.app)
  ownerId: text('owner_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
})

// Authorization codes - short-lived codes for OAuth flow
export const authorizationCodes = sqliteTable('authorization_codes', {
  code: text('code').primaryKey(),
  clientId: text('client_id').notNull().references(() => oauthClients.id),
  userId: text('user_id').notNull().references(() => users.id),
  redirectUri: text('redirect_uri').notNull(),
  scope: text('scope').notNull(),
  codeChallenge: text('code_challenge'), // PKCE
  codeChallengeMethod: text('code_challenge_method'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

// Refresh tokens - long-lived tokens for obtaining new access tokens
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  clientId: text('client_id').notNull().references(() => oauthClients.id),
  userId: text('user_id').notNull().references(() => users.id),
  scope: text('scope').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type OAuthClient = typeof oauthClients.$inferSelect
export type NewOAuthClient = typeof oauthClients.$inferInsert
export type AuthorizationCode = typeof authorizationCodes.$inferSelect
export type NewAuthorizationCode = typeof authorizationCodes.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
