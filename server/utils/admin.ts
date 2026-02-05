import { count } from 'drizzle-orm'
import { db, schema } from 'hub:db'

/**
 * Check if there are any users in the database
 * Used to determine if the first user should be made admin
 */
export async function isFirstUser(): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(schema.users)

  return result[0].count === 0
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

import { eq } from 'drizzle-orm'

/**
 * Require admin access - throws 403 if user is not admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const isAdmin = await isUserAdmin(userId)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Admin access required',
    })
  }
}
