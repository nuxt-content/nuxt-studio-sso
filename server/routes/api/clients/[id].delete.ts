import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Only admins can delete clients
  await requireAdmin(session.user.id)

  const clientId = getRouterParam(event, 'id')
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required',
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
      message: 'Client not found',
    })
  }

  // Delete related tokens and codes first
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.clientId, clientId))
  await db.delete(schema.authorizationCodes).where(eq(schema.authorizationCodes.clientId, clientId))

  // Delete the client
  await db.delete(schema.oauthClients).where(eq(schema.oauthClients.id, clientId))

  return { success: true }
})
