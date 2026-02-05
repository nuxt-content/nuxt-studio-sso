import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { buildCallbackUrl } from '../../../utils/oauth'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Only admins can view client details
  await requireAdmin(session.user.id)

  const clientId = getRouterParam(event, 'id')
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
    })
  }

  const clients = await db
    .select({
      id: schema.oauthClients.id,
      name: schema.oauthClients.name,
      websiteUrl: schema.oauthClients.websiteUrl,
      previewUrlPattern: schema.oauthClients.previewUrlPattern,
      isActive: schema.oauthClients.isActive,
      createdAt: schema.oauthClients.createdAt,
    })
    .from(schema.oauthClients)
    .where(
      and(
        eq(schema.oauthClients.id, clientId),
        eq(schema.oauthClients.ownerId, session.user.id),
      ),
    )
    .limit(1)

  const client = clients[0]
  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found',
    })
  }

  return {
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl),
  }
})
