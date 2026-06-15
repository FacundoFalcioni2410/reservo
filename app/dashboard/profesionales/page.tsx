import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import ProfesionalesClient from './_components/ProfesionalesClient'

export default async function ProfesionalesPage() {
  const { tenantId } = await requireTenantId()

  const [professionals, branches, services] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: 'professional' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        passwordHash: true,
        branches: { select: { id: true, name: true } },
        services: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.service.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const serialized = professionals.map((p) => ({
    id: p.id,
    email: p.email,
    createdAt: p.createdAt.toISOString(),
    pendingInvite: p.passwordHash === null,
    branches: p.branches,
    services: p.services,
  }))

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <ProfesionalesClient
        professionals={serialized}
        allBranches={branches}
        allServices={services}
      />
    </div>
  )
}
