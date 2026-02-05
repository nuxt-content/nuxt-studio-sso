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
                               │  D1 Database │
                               │  (Users,     │
                               │   Clients,   │
                               │   Tokens)    │
                               └─────────────┘
```

## Features

- **Single Sign-On**: Log in once, access all connected Nuxt Studio sites
- **OpenID Connect**: Standards-compliant OAuth 2.0 + OIDC implementation
- **PKCE Support**: Enhanced security for public clients
- **GitHub Authentication**: Users log in with GitHub, enabling automatic token pass-through
- **GitHub Token Pass-Through**: Eliminates the need for a separate `STUDIO_GITHUB_TOKEN` when users log in with GitHub
- **Admin System**: First user becomes admin, only admins can manage OAuth clients
- **User Dashboard**: Non-admin users can view all websites where they can sign in
- **Preview URL Patterns**: Support for Vercel, Netlify, and other preview deployment platforms
- **Edge-Ready**: Deploys to Cloudflare Workers via NuxtHub

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Nuxt 4 |
| Database | Turso (SQLite edge) |
| ORM | Drizzle ORM |
| Auth | nuxt-auth-utils |
| Token Format | JWT with RS256 |
| UI | Nuxt UI v3 |
| Deployment | Vercel + Turso (via NuxtHub) |

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

Visit `http://localhost:3000` and log in with GitHub. **The first user to sign up automatically becomes the admin.**

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
2. Navigate to **OAuth Clients**
3. Click **New Client**
4. Fill in:
   - **Name**: Your site's name (e.g., "My Documentation Site")
   - **Website URL**: Your production URL (e.g., `https://docs.example.com`)
   - **Preview URL Pattern** (optional): Pattern for preview deployments
5. Click **Create Client**
6. **Important**: Copy the client secret immediately - it's only shown once!

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

1. User logs into SSO server with GitHub (requests `repo` scope)
2. SSO server encrypts and stores the GitHub token
3. SSO server automatically returns the GitHub token in the userinfo response
4. Studio uses this token for Git operations

**Benefits:**

- No PAT required - users authenticate with their own GitHub account
- Each user's changes are committed with their own GitHub identity
- Tokens are updated automatically when users re-authenticate

## SSO Flow

### First Login (Site A)

```
1. User visits docs.example.com → clicks "Login"
                    │
                    ▼
2. Redirect to auth.example.com/oauth/authorize
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
8. Redirect to docs.example.com/__nuxt_studio/auth/sso?code=xxx
                    │
                    ▼
9. Site A exchanges code for tokens → sets Studio session
                    │
                    ▼
✅ User is logged into Site A
```

### Subsequent Login (Site B) - SSO Magic

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
6. Redirect to blog.example.com/__nuxt_studio/auth/sso?code=xxx
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
| `/oauth/authorize` | GET | Authorization endpoint - initiates OAuth flow |
| `/oauth/token` | POST | Token endpoint - exchanges code for tokens |
| `/oauth/userinfo` | GET | Returns authenticated user info (requires Bearer token) |
| `/oauth/revoke` | POST | Revokes refresh tokens |

### Userinfo Response

The `/oauth/userinfo` endpoint always returns all available user information:

| Field | Description |
|-------|-------------|
| `sub` | User's unique identifier |
| `name` | User's display name |
| `email` | User's email address |
| `picture` | User's avatar URL |
| `github_token` | GitHub access token (only if user logged in with GitHub) |
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

### Deploy to Vercel with Turso

1. Create a Turso database at [turso.tech](https://turso.tech)
2. Push your code to a GitHub repository
3. Import the project in Vercel
4. Add **Turso** from the Vercel Marketplace (Storage tab)
5. Set the required environment variables (see below)
6. Deploy

### Environment Variables in Production

Set these in your Vercel project settings:

- `NUXT_SESSION_PASSWORD` - Session encryption key (minimum 32 characters)
- `NUXT_OAUTH_GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `NUXT_OAUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth App client secret
- `NUXT_JWT_PRIVATE_KEY` - RSA private key for JWT signing
- `NUXT_JWT_PUBLIC_KEY` - RSA public key for JWT verification
- `TURSO_DATABASE_URL` - Turso database URL (auto-set if using Vercel Marketplace)
- `TURSO_AUTH_TOKEN` - Turso auth token (auto-set if using Vercel Marketplace)

## Security Considerations

1. **Always use HTTPS** in production
2. **Keep client secrets secure** - never commit to version control
3. **Rotate JWT keys periodically** - update both auth server and verify clients handle key rotation
4. **GitHub tokens are encrypted** using AES-256-GCM before storage
5. **Access tokens expire in 1 hour**, refresh tokens in 30 days

## Troubleshooting

### "Invalid redirect_uri" error

Ensure your website URL is correctly configured in the OAuth client settings. The callback path is automatically appended.

### "Invalid state" error

The OAuth state cookie may have expired (15 minutes). Try the login flow again.

### "Invalid client credentials" error

Double-check your `STUDIO_OAUTH_CLIENT_ID` and `STUDIO_OAUTH_CLIENT_SECRET` environment variables.

### "Admin access required" error

Only the first user to sign up becomes an admin. Contact your administrator if you need to manage OAuth clients.

### No GitHub token in userinfo response

Ensure the user has successfully authenticated with GitHub on the SSO server. The GitHub token is captured during the GitHub OAuth flow and stored encrypted in the database.

## License

MIT
