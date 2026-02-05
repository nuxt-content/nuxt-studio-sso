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

  // Verify client exists
  const existingClients = await db
    .select()
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.id, clientId))
    .limit(1)

  if (!existingClients[0]) {
    throw createError({
      statusCode: 404,
      message: 'Client not found'
    })
  }

  // Generate new secret
  const newSecret = generateSecureToken(32)
  const secretHash = await hashToken(newSecret)

  // Update the client
  await db
    .update(schema.oauthClients)
    .set({ secretHash })
    .where(eq(schema.oauthClients.id, clientId))

  return {
    secret: newSecret,
    message: 'Client secret regenerated. Make sure to save it as it will not be shown again.'
  }
})
