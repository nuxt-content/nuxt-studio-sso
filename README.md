# Nuxt Studio SSO

A centralized OAuth 2.0 Authorization Server that enables Single Sign-On (SSO) across multiple Nuxt Studio-powered websites.

## Overview

Instead of configuring GitHub OAuth on each Nuxt Studio site individually, this server acts as a central identity provider. Users authenticate once with GitHub and gain access to all connected Nuxt Studio sites, with their GitHub token automatically passed through for Git operations.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Site A             │     │  Nuxt Studio SSO    │     │  Site B             │
│  docs.example.com   │     │  auth.example.com   │     │  blog.example.com   │
│                     │     │                     │     │                     │
│  Client ID: abc123  │◄───►│  OAuth Server       │◄───►│  Client ID: xyz789  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                      │
                               ┌──────┴──────┐
                               │   Database  │
                               │  (Users,    │
                               │   Clients,  │
                               │   Tokens)   │
                               └─────────────┘
```

## Features

- **Single Sign-On**: Log in once, access all connected Nuxt Studio sites
- **OpenID Connect**: Standards-compliant OAuth 2.0 + OIDC implementation
- **PKCE Required**: S256 PKCE is mandatory for all authorization requests (OAuth 2.1)
- **GitHub Authentication**: Users log in with GitHub, enabling automatic token pass-through
- **GitHub Token Pass-Through**: Eliminates the need for a separate `STUDIO_GITHUB_TOKEN`
- **Admin System**: First user becomes admin, only admins can manage OAuth clients
- **User Dashboard**: Non-admin users can view all websites where they can sign in
- **Preview URL Patterns**: Support for Vercel, Netlify, and other preview deployment platforms
- **Multi-Cloud**: Deploy anywhere Nuxt runs — Vercel, Netlify, Cloudflare, AWS, and more via NuxtHub

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | [Nuxt 4](https://nuxt.com) |
| Database | SQLite (via [NuxtHub](https://hub.nuxt.com)) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| Token Format | JWT with RS256 |
| UI | [Nuxt UI](https://ui.nuxt.com) |

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/nuxt-content/nuxt-studio-sso
cd nuxt-studio-sso
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
# Session encryption (minimum 32 characters)
NUXT_SESSION_PASSWORD=your-super-secret-session-password-here

# GitHub OAuth (for logging into the auth server)
NUXT_OAUTH_GITHUB_CLIENT_ID=your-github-client-id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret

# JWT Keys (RS256) - see below for generation
NUXT_JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
NUXT_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# GitHub scope (optional, defaults to public_repo)
# Use comma-separated values, e.g. "repo" for full private repo access
GITHUB_SCOPE=public_repo
```

### 3. Generate JWT Keys

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert to single-line format for .env
cat private.pem | tr '\n' '\\n' | sed 's/\\n$//'
cat public.pem | tr '\n' '\\n' | sed 's/\\n$//'
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:5000` and log in with GitHub. **The first user to sign up automatically becomes the admin.**

## User Roles

### Admin Users

- **First user is admin**: The first person to sign up becomes the admin automatically
- Can create, edit, and delete OAuth clients
- Can view all registered clients and their settings
- Has access to OIDC configuration links

### Regular Users

- Can log in and authorize OAuth requests from client sites
- Can view a list of all connected websites where they can sign in
- Cannot create or manage OAuth clients

## Registering OAuth Clients

> **Note**: Only admin users can register OAuth clients.

1. Log into the SSO server dashboard at `/dashboard`
2. Navigate to **Clients**
3. Click **New Client**
4. Fill in:
   - **Client Name**: Your site's name (e.g., "My Documentation Site")
   - **Website URL**: Your production URL (e.g., `https://docs.example.com`)
   - **Preview URL Pattern** (optional): Pattern for preview deployments
5. Click **Create Client**
6. **Important**: Copy the client secret immediately — it's only shown once!

The callback URL (`/__nuxt_studio/auth/sso`) is automatically appended to your website URL.

### Preview URL Patterns

For sites deployed on platforms like Vercel or Netlify, configure a preview URL pattern to allow authentication from preview deployments:

| Platform | Pattern Example |
|----------|-----------------|
| Vercel | `https://*.vercel.app` or `https://my-project-*.vercel.app` |
| Netlify | `https://*.netlify.app` or `https://deploy-preview-*--my-site.netlify.app` |
| Cloudflare Pages | `https://*.pages.dev` |

The `*` wildcard matches any characters in that position.

## Integrating with Nuxt Studio Sites

The Nuxt Studio module has built-in support for the SSO server. Set these environment variables on your Nuxt Studio site:

```bash
# SSO server credentials (from admin dashboard)
STUDIO_SSO_URL=https://auth.example.com
STUDIO_SSO_CLIENT_ID=<client_id from dashboard>
STUDIO_SSO_CLIENT_SECRET=<client_secret from dashboard>
```

Users can then log in via the `/__nuxt_studio/auth/sso` route.

### GitHub Token Pass-Through

When users log in to the SSO server with GitHub, their GitHub access token is securely captured and passed to client sites. This eliminates the need for a separate `STUDIO_GITHUB_TOKEN` environment variable.

**How it works:**

1. User logs into SSO server with GitHub (requests `public_repo` scope by default)
2. SSO server encrypts and stores the GitHub token
3. SSO server returns the GitHub token in the userinfo response
4. Studio uses this token for Git operations

**Configuring GitHub scope:**

By default, the server requests `public_repo` scope (read/write access to public repositories only). To grant access to private repositories, set the `GITHUB_SCOPE` environment variable:

```bash
# Full private repo access
GITHUB_SCOPE=repo

# Multiple scopes (comma-separated)
GITHUB_SCOPE=repo,read:org
```

**Benefits:**

- No PAT required — users authenticate with their own GitHub account
- Each user's changes are committed with their own GitHub identity
- Tokens are updated automatically when users re-authenticate

## SSO Flow

### First Login (Site A)

```
1. User visits docs.example.com → clicks "Login"
                    │
                    ▼
2. Redirect to auth.example.com/oauth/authorize
   (with client_id, redirect_uri, state, code_challenge)
                    │
                    ▼
3. User not logged in → shows login page
                    │
                    ▼
4. User clicks "Continue with GitHub"
                    │
                    ▼
5. GitHub OAuth flow → user authenticated
                    │
                    ▼
6. Shows consent screen: "docs.example.com wants to access your account"
                    │
                    ▼
7. User approves → authorization code generated
                    │
                    ▼
8. Redirect to docs.example.com/__nuxt_studio/auth/sso?code=xxx&state=yyy
                    │
                    ▼
9. Site A exchanges code + code_verifier for tokens → sets Studio session
                    │
                    ▼
✅ User is logged into Site A
```

### Subsequent Login (Site B) — SSO Magic

```
1. User visits blog.example.com → clicks "Login"
                    │
                    ▼
2. Redirect to auth.example.com/oauth/authorize
                    │
                    ▼
3. SSO server recognizes existing session!
                    │
                    ▼
4. Shows consent screen (user already authenticated)
                    │
                    ▼
5. User approves → authorization code generated
                    │
                    ▼
6. Redirect to blog.example.com/__nuxt_studio/auth/sso?code=xxx&state=yyy
                    │
                    ▼
7. Site B exchanges code for tokens → sets Studio session
                    │
                    ▼
✅ User is logged into Site B (no password needed!)
```

## API Reference

### OAuth 2.0 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Authorization endpoint — initiates OAuth flow |
| `/oauth/token` | POST | Token endpoint — exchanges code for tokens |
| `/oauth/userinfo` | GET | Returns authenticated user info (requires Bearer token) |
| `/oauth/revoke` | POST | Revokes refresh tokens |

#### Authorization Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | The registered client ID |
| `redirect_uri` | Yes | Must match the registered website URL callback |
| `response_type` | Yes | Must be `code` |
| `state` | Yes | CSRF protection token |
| `code_challenge` | Yes | PKCE code challenge (S256) |
| `code_challenge_method` | No | Must be `S256` (default) |

#### Token Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | `authorization_code` or `refresh_token` |
| `code` | Yes* | The authorization code (*for `authorization_code` grant) |
| `redirect_uri` | Yes* | Must match the authorization request (*for `authorization_code` grant) |
| `code_verifier` | Yes* | PKCE code verifier (*for `authorization_code` grant) |
| `refresh_token` | Yes* | The refresh token (*for `refresh_token` grant) |
| `client_id` | Yes | Via body or Basic auth header |
| `client_secret` | Yes | Via body or Basic auth header |

### Userinfo Response

The `/oauth/userinfo` endpoint returns user information:

| Field | Description |
|-------|-------------|
| `sub` | User's unique identifier |
| `name` | User's display name |
| `email` | User's email address |
| `picture` | User's avatar URL |
| `github_token` | GitHub access token (if user logged in with GitHub) |
| `git_provider` | Set to `"github"` when GitHub token is available |

### OpenID Connect Discovery

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/openid-configuration` | GET | OIDC discovery document |
| `/.well-known/jwks.json` | GET | JSON Web Key Set for token verification |

### Management API (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients` | GET | List all OAuth clients |
| `/api/clients` | POST | Create a new client |
| `/api/clients/:id` | GET | Get client details |
| `/api/clients/:id` | PATCH | Update client |
| `/api/clients/:id` | DELETE | Delete client |
| `/api/clients/:id/secret` | POST | Regenerate client secret |

### Public API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/websites` | GET | List all connected websites (for authenticated users) |

## Deployment

### Deploy with NuxtHub

This project uses [NuxtHub](https://hub.nuxt.com) for database management, which supports multiple cloud providers.

1. Push your code to a GitHub repository
2. Deploy to your preferred platform (Vercel, Netlify, etc.)
3. Set the required environment variables

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUXT_SESSION_PASSWORD` | Yes | Session encryption key (minimum 32 characters) |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `NUXT_JWT_PRIVATE_KEY` | Yes | RSA private key for JWT signing |
| `NUXT_JWT_PUBLIC_KEY` | Yes | RSA public key for JWT verification |
| `GITHUB_SCOPE` | No | GitHub OAuth scopes (default: `public_repo`) |

For database configuration, see the [NuxtHub deployment docs](https://hub.nuxt.com/docs/getting-started/deploy).

## Security

- **PKCE required**: All authorization requests must include a `code_challenge` (S256 only)
- **State required**: The `state` parameter is mandatory for CSRF protection
- **Authorization codes hashed**: Stored as SHA-256 hashes, not plaintext
- **Client secrets hashed**: Stored as SHA-256 hashes
- **Refresh tokens hashed**: Stored as SHA-256 hashes
- **GitHub tokens encrypted**: AES-256-GCM encryption at rest
- **Timing-safe comparisons**: All secret/hash comparisons use `timingSafeEqual`
- **Access tokens**: JWT with RS256 signing, 1-hour expiry
- **Refresh tokens**: 30-day expiry
- **Token responses**: Include `Cache-Control: no-store` per RFC 6749
- **Always use HTTPS** in production

## Troubleshooting

### "Missing required parameter: code_challenge"

PKCE is required. Ensure your client sends `code_challenge` and `code_challenge_method=S256` in the authorization request, and `code_verifier` in the token exchange.

### "Invalid redirect_uri" error

Ensure your website URL is correctly configured in the OAuth client settings. The callback path `/__nuxt_studio/auth/sso` is automatically appended.

### "Invalid state" error

The OAuth state cookie may have expired. Try the login flow again.

### "Invalid client credentials" error

Double-check your `STUDIO_SSO_CLIENT_ID` and `STUDIO_SSO_CLIENT_SECRET` environment variables.

### "Admin access required" error

Only the first user to sign up becomes an admin. Contact your administrator if you need to manage OAuth clients.

### No GitHub token in userinfo response

Ensure the user has successfully authenticated with GitHub on the SSO server. The GitHub token is captured during the GitHub OAuth flow and stored encrypted in the database.

## License

MIT
