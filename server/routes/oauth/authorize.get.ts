import { getOAuthClient, validateRedirectUri } from '../../utils/oauth'

// Fixed scope - always return all user info + GitHub token if available
const DEFAULT_SCOPE = 'openid profile email git:github'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Required OAuth parameters
  const clientId = query.client_id as string
  const redirectUri = query.redirect_uri as string
  const responseType = query.response_type as string
  const state = query.state as string

  // PKCE parameters (optional but recommended)
  const codeChallenge = query.code_challenge as string | undefined
  const codeChallengeMethod = (query.code_challenge_method as string) || 'S256'

  // Validate required parameters
  if (!clientId || !redirectUri || !responseType) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters: client_id, redirect_uri, response_type',
    })
  }

  // Only support authorization code flow
  if (responseType !== 'code') {
    throw createError({
      statusCode: 400,
      message: 'Unsupported response_type. Only "code" is supported.',
    })
  }

  // Validate client
  const client = await getOAuthClient(clientId)
  if (!client) {
    throw createError({
      statusCode: 400,
      message: 'Invalid client_id',
    })
  }

  // Validate redirect URI against website URL and preview pattern
  if (!validateRedirectUri(redirectUri, client.websiteUrl, client.previewUrlPattern)) {
    throw createError({
      statusCode: 400,
      message: `Invalid redirect_uri. Expected callback at ${client.websiteUrl}/__nuxt_studio/auth/sso${client.previewUrlPattern ? ` or matching pattern ${client.previewUrlPattern}` : ''}`,
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
        codeChallengeMethod,
      },
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
      clientName: client.name,
    },
  })

  return sendRedirect(event, '/authorize')
})
