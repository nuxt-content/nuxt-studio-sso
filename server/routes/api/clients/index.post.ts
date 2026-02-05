import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const session = await requireAdminUser(event)

  const body = await readBody(event)
  const { name, websiteUrl, previewUrlPattern } = body

  // Validate required fields
  if (!name || !websiteUrl) {
    throw createError({
      statusCode: 400,
      message: 'Name and website URL are required'
    })
  }

  // Validate website URL format
  try {
    const url = new URL(websiteUrl)
    if (url.pathname !== '/' && url.pathname !== '') {
      throw createError({
        statusCode: 400,
        message: 'Website URL should not include a path. The callback path will be added automatically.'
      })
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('callback path')) {
      throw e
    }
    throw createError({
      statusCode: 400,
      message: `Invalid website URL: ${websiteUrl}`
    })
  }

  // Validate preview URL pattern format (if provided)
  if (previewUrlPattern) {
    // Basic validation - should be a URL-like pattern with optional wildcards
    if (!previewUrlPattern.startsWith('https://') && !previewUrlPattern.startsWith('http://')) {
      throw createError({
        statusCode: 400,
        message: 'Preview URL pattern must start with https:// or http://'
      })
    }
  }

  // Generate client credentials
  const clientId = generateUUID()
  const clientSecret = generateSecureToken(32)
  const secretHash = await hashToken(clientSecret)

  // Normalize website URL (remove trailing slash)
  const normalizedWebsiteUrl = websiteUrl.replace(/\/$/, '')

  // Build redirect URIs array (for backwards compatibility with DB schema)
  const callbackUrl = buildCallbackUrl(normalizedWebsiteUrl)
  const redirectUris = previewUrlPattern
    ? [callbackUrl, `${previewUrlPattern.replace(/\/$/, '')}${STUDIO_CALLBACK_PATH}`]
    : [callbackUrl]

  // Create the client
  await db.insert(schema.oauthClients).values({
    id: clientId,
    secretHash,
    name,
    websiteUrl: normalizedWebsiteUrl,
    previewUrlPattern: previewUrlPattern || null,
    redirectUris: JSON.stringify(redirectUris),
    ownerId: session.user.id as string,
    createdAt: new Date(),
    isActive: true
  })

  // Return the client with the secret (only shown once)
  return {
    id: clientId,
    secret: clientSecret,
    name,
    websiteUrl: normalizedWebsiteUrl,
    previewUrlPattern: previewUrlPattern || null,
    callbackUrl: buildCallbackUrl(normalizedWebsiteUrl),
    createdAt: new Date().toISOString()
  }
})
