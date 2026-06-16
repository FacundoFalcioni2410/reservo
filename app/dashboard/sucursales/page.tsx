import { redirect } from 'next/navigation'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SucursalesClient from './_components/SucursalesClient'

export default async function SucursalesPage() {
  const { tenantId, role } = await requireTenantId()
  if (role === 'professional') redirect('/dashboard/reservas')

  const [branches, tenant, allServices] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        openTime: true,
        closeTime: true,
        workingDays: true,
        professionals: { select: { id: true, email: true } },
        services: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { openTime: true, closeTime: true, workingDays: true },
    }),
    prisma.service.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!tenant) notFound()

  const serializedBranches = branches.map((b) => ({
    ...b,
    serviceIds: b.services.map((s) => s.id),
  }))

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <SucursalesClient
        branches={serializedBranches}
        tenantDefaults={{
          openTime: tenant.openTime,
          closeTime: tenant.closeTime,
          workingDays: tenant.workingDays,
        }}
        allServices={allServices}
      />
    </div>
  )
}
