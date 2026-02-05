import { eq } from 'drizzle-orm'
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

  // Only admins can list clients
  await requireAdmin(session.user.id)

  // Get all clients owned by the user
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
    .where(eq(schema.oauthClients.ownerId, session.user.id))

  return clients.map(client => ({
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl),
  }))
})
