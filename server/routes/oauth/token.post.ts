export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Get client credentials from Authorization header or body
  let clientId: string | undefined
  let clientSecret: string | undefined

  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader?.startsWith('Basic ')) {
    const credentials = atob(authHeader.slice(6))
    const [id, secret] = credentials.split(':')
    clientId = id
    clientSecret = secret
  } else {
    clientId = body.client_id
    clientSecret = body.client_secret
  }

  if (!clientId || !clientSecret) {
    setResponseStatus(event, 401)
    return {
      error: 'invalid_client',
      error_description: 'Client credentials required'
    }
  }

  // Verify client credentials
  const client = await verifyClientCredentials(clientId, clientSecret)
  if (!client) {
    setResponseStatus(event, 401)
    return {
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    }
  }

  const grantType = body.grant_type
  const baseUrl = getRequestURL(event).origin

  if (grantType === 'authorization_code') {
    const code = body.code
    const redirectUri = body.redirect_uri
    const codeVerifier = body.code_verifier

    if (!code || !redirectUri) {
      setResponseStatus(event, 400)
      return {
        error: 'invalid_request',
        error_description: 'Missing code or redirect_uri'
      }
    }

    // Exchange code for user
    const result = await exchangeAuthorizationCode(code, clientId, redirectUri, codeVerifier)
    if (!result) {
      setResponseStatus(event, 400)
      return {
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      }
    }

    const { user, scope } = result

    // Generate tokens
    const accessToken = await generateAccessToken(
      user,
      clientId,
      scope,
      baseUrl,
      config.jwtPrivateKey,
      3600 // 1 hour
    )

    const refreshToken = await createRefreshToken(clientId, user.id, scope)

    const response: Record<string, unknown> = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope
    }

    // Include ID token if openid scope was requested
    if (scope.includes('openid')) {
      response.id_token = await generateIdToken(
        user,
        clientId,
        baseUrl,
        config.jwtPrivateKey,
        undefined,
        3600
      )
    }

    return response
  } else if (grantType === 'refresh_token') {
    const refreshTokenValue = body.refresh_token

    if (!refreshTokenValue) {
      setResponseStatus(event, 400)
      return {
        error: 'invalid_request',
        error_description: 'Missing refresh_token'
      }
    }

    // Exchange refresh token
    const result = await exchangeRefreshToken(refreshTokenValue, clientId)
    if (!result) {
      setResponseStatus(event, 400)
      return {
        error: 'invalid_grant',
        error_description: 'Invalid or expired refresh token'
      }
    }

    const { user, scope } = result

    // Generate new access token
    const accessToken = await generateAccessToken(
      user,
      clientId,
      scope,
      baseUrl,
      config.jwtPrivateKey,
      3600
    )

    const response: Record<string, unknown> = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope
    }

    // Include ID token if openid scope was requested
    if (scope.includes('openid')) {
      response.id_token = await generateIdToken(
        user,
        clientId,
        baseUrl,
        config.jwtPrivateKey,
        undefined,
        3600
      )
    }

    return response
  } else {
    setResponseStatus(event, 400)
    return {
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code and refresh_token grant types are supported'
    }
  }
})
