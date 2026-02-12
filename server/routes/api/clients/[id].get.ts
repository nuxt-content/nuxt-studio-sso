import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const clientId = getRouterParam(event, 'id')
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required'
    })
  }

  const clients = await db
    .select({
      id: schema.oauthClients.id,
      name: schema.oauthClients.name,
      websiteUrl: schema.oauthClients.websiteUrl,
      previewUrlPattern: schema.oauthClients.previewUrlPattern,
      isActive: schema.oauthClients.isActive,
      createdAt: schema.oauthClients.createdAt
    })
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.id, clientId))
    .limit(1)

  const client = clients[0]
  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Client not found'
    })
  }

  return {
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl)
  }
})
