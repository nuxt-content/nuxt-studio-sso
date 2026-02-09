// Fixed scope - always return all user info + GitHub token if available
const DEFAULT_SCOPE = 'openid profile email git:github'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Required OAuth parameters
  const clientId = query.client_id as string
  const redirectUri = query.redirect_uri as string
  const responseType = query.response_type as string
  const state = query.state as string

  // PKCE parameters (required per OAuth 2.1)
  const codeChallenge = query.code_challenge as string | undefined
  const codeChallengeMethod = (query.code_challenge_method as string) || 'S256'

  // Validate required parameters
  if (!clientId || !redirectUri || !responseType || !state) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters: client_id, redirect_uri, response_type, state'
    })
  }

  // Require PKCE
  if (!codeChallenge) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: code_challenge. PKCE is required.'
    })
  }

  // Only allow S256 challenge method
  if (codeChallengeMethod !== 'S256') {
    throw createError({
      statusCode: 400,
      message: 'Unsupported code_challenge_method. Only "S256" is supported.'
    })
  }

  // Only support authorization code flow
  if (responseType !== 'code') {
    throw createError({
      statusCode: 400,
      message: 'Unsupported response_type. Only "code" is supported.'
    })
  }

  // Validate client
  const client = await getOAuthClient(clientId)
  if (!client) {
    throw createError({
      statusCode: 400,
      message: 'Invalid client_id'
    })
  }

  // Validate redirect URI against website URL and preview pattern
  if (!validateRedirectUri(redirectUri, client.websiteUrl, client.previewUrlPattern)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid redirect_uri for the specified client.'
    })
  }

  // Check if user is logged in
  const session = await getUserSession(event)

  if (!session.user) {
    // Store OAuth parameters in session and redirect to login
    await setUserSession(event, {
      oauthRequest: {
        clientId,
        redirectUri,
        scope: DEFAULT_SCOPE,
        state,
        codeChallenge,
        codeChallengeMethod
      }
    })

    return sendRedirect(event, '/login')
  }

  // User is logged in - store parameters and redirect to consent page
  await setUserSession(event, {
    ...session,
    oauthRequest: {
      clientId,
      redirectUri,
      scope: DEFAULT_SCOPE,
      state,
      codeChallenge,
      codeChallengeMethod,
      clientName: client.name
    }
  })

  return sendRedirect(event, '/authorize')
})
