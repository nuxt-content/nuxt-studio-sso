import { revokeRefreshToken, verifyClientCredentials } from '../../utils/oauth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Get client credentials from Authorization header or body
  let clientId: string | undefined
  let clientSecret: string | undefined

  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader?.startsWith('Basic ')) {
    const credentials = atob(authHeader.slice(6))
    const [id, secret] = credentials.split(':')
    clientId = id
    clientSecret = secret
  }
  else {
    clientId = body.client_id
    clientSecret = body.client_secret
  }

  if (!clientId || !clientSecret) {
    setResponseStatus(event, 401)
    return {
      error: 'invalid_client',
      error_description: 'Client credentials required',
    }
  }

  // Verify client credentials
  const client = await verifyClientCredentials(clientId, clientSecret)
  if (!client) {
    setResponseStatus(event, 401)
    return {
      error: 'invalid_client',
      error_description: 'Invalid client credentials',
    }
  }

  const token = body.token
  const tokenTypeHint = body.token_type_hint || 'refresh_token'

  if (!token) {
    setResponseStatus(event, 400)
    return {
      error: 'invalid_request',
      error_description: 'Missing token parameter',
    }
  }

  // Revoke the token
  // Note: Per RFC 7009, we should return 200 OK even if the token doesn't exist
  if (tokenTypeHint === 'refresh_token' || tokenTypeHint === 'access_token') {
    // For refresh tokens, revoke them in the database
    // For access tokens (JWTs), we can't truly revoke them, but we return success
    if (tokenTypeHint === 'refresh_token') {
      await revokeRefreshToken(token)
    }
    // Access tokens are JWTs and will expire naturally
    // In a production system, you might want to implement a token blacklist
  }

  // Always return 200 OK per RFC 7009
  return {}
})
