import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { buildCallbackUrl, STUDIO_CALLBACK_PATH } from '../../../utils/oauth'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Only admins can update clients
  await requireAdmin(session.user.id)

  const clientId = getRouterParam(event, 'id')
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const body = await readBody(event)
  const { name, websiteUrl, previewUrlPattern, isActive } = body

  // Verify ownership
  const existingClients = await db
    .select()
    .from(schema.oauthClients)
    .where(
      and(
        eq(schema.oauthClients.id, clientId),
        eq(schema.oauthClients.ownerId, session.user.id),
      ),
    )
    .limit(1)

  if (!existingClients[0]) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  // Build update object
  const updates: Record<string, unknown> = {}

  if (name !== undefined) {
    updates.name = name
  }

  if (websiteUrl !== undefined) {
    // Validate website URL format
    try {
      const url = new URL(websiteUrl)
      if (url.pathname !== '/' && url.pathname !== '') {
        throw createError({
          statusCode: 400,
          message: 'Website URL should not include a path. The callback path will be added automatically.',
        })
      }
    }
    catch (e) {
      if (e instanceof Error && e.message.includes('callback path')) {
        throw e
      }
      throw createError({
        statusCode: 400,
        message: `Invalid website URL: ${websiteUrl}`,
      })
    }
    updates.websiteUrl = websiteUrl.replace(/\/$/, '')
  }

  if (previewUrlPattern !== undefined) {
    if (previewUrlPattern && !previewUrlPattern.startsWith('https://') && !previewUrlPattern.startsWith('http://')) {
      throw createError({
        statusCode: 400,
        message: 'Preview URL pattern must start with https:// or http://',
      })
    }
    updates.previewUrlPattern = previewUrlPattern || null
  }

  // Rebuild redirectUris if websiteUrl or previewUrlPattern changed
  if (updates.websiteUrl !== undefined || updates.previewUrlPattern !== undefined) {
    const finalWebsiteUrl = (updates.websiteUrl as string) || existingClients[0].websiteUrl
    const finalPreviewPattern = updates.previewUrlPattern !== undefined
      ? (updates.previewUrlPattern as string | null)
      : existingClients[0].previewUrlPattern

    const callbackUrl = buildCallbackUrl(finalWebsiteUrl)
    const redirectUris = finalPreviewPattern
      ? [callbackUrl, `${finalPreviewPattern.replace(/\/$/, '')}${STUDIO_CALLBACK_PATH}`]
      : [callbackUrl]
    updates.redirectUris = JSON.stringify(redirectUris)
  }

  if (isActive !== undefined) {
    updates.isActive = isActive
  }

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update',
    })
  }

  await db
    .update(schema.oauthClients)
    .set(updates)
    .where(eq(schema.oauthClients.id, clientId))

  // Fetch and return updated client
  const updatedClients = await db
    .select({
      id: schema.oauthClients.id,
      name: schema.oauthClients.name,
      websiteUrl: schema.oauthClients.websiteUrl,
      previewUrlPattern: schema.oauthClients.previewUrlPattern,
      isActive: schema.oauthClients.isActive,
      createdAt: schema.oauthClients.createdAt,
    })
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.id, clientId))
    .limit(1)

  const client = updatedClients[0]

  return {
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl),
  }
})
