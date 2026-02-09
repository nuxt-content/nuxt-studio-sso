import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get access token from Authorization header
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    setResponseStatus(event, 401)
    setResponseHeader(event, 'WWW-Authenticate', 'Bearer')
    return {
      error: 'invalid_token',
      error_description: 'Missing or invalid access token'
    }
  }

  const accessToken = authHeader.slice(7)
  const baseUrl = getRequestURL(event).origin

  // Verify the token (validate issuer matches this server)
  const payload = await verifyJWT(accessToken, config.jwtPublicKey, {
    issuer: baseUrl
  })
  if (!payload) {
    setResponseStatus(event, 401)
    setResponseHeader(event, 'WWW-Authenticate', 'Bearer error="invalid_token"')
    return {
      error: 'invalid_token',
      error_description: 'Token is invalid or expired'
    }
  }

  // Get user from database
  const userResults = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, payload.sub))
    .limit(1)

  const user = userResults[0]
  if (!user) {
    setResponseStatus(event, 401)
    return {
      error: 'invalid_token',
      error_description: 'User not found'
    }
  }

  // Always return all user information
  const response: Record<string, unknown> = {
    sub: user.id,
    name: user.name,
    email: user.email,
    picture: user.avatar
  }

  // Include GitHub token if user has one (logged in with GitHub)
  if (user.githubToken) {
    const githubToken = await decryptToken(user.githubToken, config.session.password)
    if (githubToken) {
      response.github_token = githubToken
      response.git_provider = 'github'
    }
  }

  return response
})
