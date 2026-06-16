import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import NavShell from './_components/NavShell'
import ProNavShell from './pro/_components/ProNavShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, role } = await requireTenantId()

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { name: true, logoUrl: true },
  })

  if (role === 'professional') {
    return <ProNavShell tenant={tenant}>{children}</ProNavShell>
  }

  return (
    <NavShell tenant={tenant}>
      {children}
    </NavShell>
  )
}
