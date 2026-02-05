import { count, eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import type { H3Event } from 'h3'

/**
 * Check if there are any users in the database
 * Used to determine if the first user should be made admin
 */
export async function isFirstUser(): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(schema.users)

  return result[0]!.count === 0
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const users = await db
    .select({ isAdmin: schema.users.isAdmin })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  return users[0]?.isAdmin === true
}

/**
 * Require an authenticated admin user.
 * Calls requireUserSession(event), then checks admin status.
 * Throws 401 if not logged in, 403 if not admin.
 * Returns the user session.
 */
export async function requireAdminUser(event: H3Event) {
  const session = await requireUserSession(event)
  const userId = session.user.id as string
  const isAdmin = await isUserAdmin(userId)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }
  return session
}
