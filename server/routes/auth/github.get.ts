import { eq, or } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['repo']
  },
  async onSuccess(event, { user: githubUser, tokens }) {
    const config = useRuntimeConfig()

    // Encrypt the GitHub access token for storage
    let encryptedGithubToken: string | null = null
    if (tokens.access_token) {
      encryptedGithubToken = await encryptToken(tokens.access_token, config.session.password)
    }

    const email = githubUser.email as string | null
    if (!email) {
      console.error('GitHub user has no email')
      return sendRedirect(event, '/login?error=github_no_email')
    }

    // Check if user exists by GitHub ID or email
    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.githubId, String(githubUser.id)),
          eq(schema.users.email, email)
        )
      )
      .limit(1)

    let user = existingUsers[0]

    if (user) {
      // Update existing user (including GitHub token)
      await db
        .update(schema.users)
        .set({
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          githubId: String(githubUser.id),
          githubToken: encryptedGithubToken,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, user.id))

      user = {
        ...user,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        githubId: String(githubUser.id),
        githubToken: encryptedGithubToken,
        updatedAt: new Date()
      }
    } else {
      // Check if this is the first user (will be made admin)
      const shouldBeAdmin = await isFirstUser()

      // Create new user with GitHub token
      const newUser = {
        id: generateUUID(),
        email,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        githubId: String(githubUser.id),
        githubToken: encryptedGithubToken,
        isAdmin: shouldBeAdmin,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.insert(schema.users).values(newUser)
      user = newUser
    }

    // Get current session to check for pending OAuth request
    const session = await getUserSession(event)
    const oauthRequest = session.oauthRequest

    // Set user session
    await setUserSession(event, {
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        avatar: user!.avatar,
        isAdmin: user!.isAdmin ?? false
      },
      oauthRequest // Preserve OAuth request if present
    })

    // Redirect to consent page if there's a pending OAuth request, otherwise to dashboard
    if (oauthRequest) {
      return sendRedirect(event, '/authorize')
    }

    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=github_auth_failed')
  }
})
