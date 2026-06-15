import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import NavShell from './_components/NavShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = await requireTenantId()
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { name: true, logoUrl: true },
  })

  return (
    <NavShell tenant={tenant}>
      {children}
    </NavShell>
  )
}
