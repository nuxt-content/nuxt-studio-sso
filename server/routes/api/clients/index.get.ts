import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const session = await requireAdminUser(event)

  // Get all clients owned by the user
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
    .where(eq(schema.oauthClients.ownerId, session.user.id as string))

  return clients.map(client => ({
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl)
  }))
})
