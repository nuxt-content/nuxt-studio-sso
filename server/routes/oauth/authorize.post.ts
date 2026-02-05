import { createAuthorizationCode } from '../../utils/oauth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Get OAuth request from session
  const oauthRequest = session.oauthRequest
  if (!oauthRequest) {
    throw createError({
      statusCode: 400,
      message: 'No OAuth request in session',
    })
  }

  const body = await readBody(event)
  const { approved } = body

  // Clear OAuth request from session
  await setUserSession(event, {
    ...session,
    oauthRequest: undefined,
  })

  // Build redirect URL
  const redirectUrl = new URL(oauthRequest.redirectUri)

  if (!approved) {
    // User denied the request
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('error_description', 'User denied the authorization request')
    if (oauthRequest.state) {
      redirectUrl.searchParams.set('state', oauthRequest.state)
    }
    // Return redirect URL for client-side navigation
    return { redirectUrl: redirectUrl.toString() }
  }

  // Generate authorization code
  const code = await createAuthorizationCode(
    oauthRequest.clientId,
    session.user.id,
    oauthRequest.redirectUri,
    oauthRequest.scope,
    oauthRequest.codeChallenge,
    oauthRequest.codeChallengeMethod,
  )

  // Add code and state to redirect URL
  redirectUrl.searchParams.set('code', code)
  if (oauthRequest.state) {
    redirectUrl.searchParams.set('state', oauthRequest.state)
  }

  // Return redirect URL for client-side navigation
  return { redirectUrl: redirectUrl.toString() }
})
