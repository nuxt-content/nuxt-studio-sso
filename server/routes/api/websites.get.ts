import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

/**
 * Public endpoint that returns the list of websites where users can log in
 * This is available to all authenticated users (not just admins)
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Get all active clients (public info only - no secrets)
  const clients = await db
    .select({
      name: schema.oauthClients.name,
      websiteUrl: schema.oauthClients.websiteUrl,
    })
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.isActive, true))

  return clients
})
