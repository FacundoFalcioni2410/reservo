import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  return {
    isAuth: true,
    userId: session.userId,
    role: session.role,
    tenantId: session.tenantId,
  }
})

/**
 * Use at the start of any server action or component that reads/writes tenant data.
 * Guarantees tenantId is present — redirects to /login otherwise.
 */
export const requireTenantId = cache(async () => {
  const session = await verifySession()
  if (!session.tenantId) redirect('/login')
  return {
    userId: session.userId,
    role: session.role,
    tenantId: session.tenantId,
  }
})
