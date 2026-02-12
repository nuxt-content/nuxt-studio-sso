import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  // Get all clients
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

  return clients.map(client => ({
    ...client,
    callbackUrl: buildCallbackUrl(client.websiteUrl)
  }))
})
