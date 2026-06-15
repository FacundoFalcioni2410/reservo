import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import ServiciosClient from './_components/ServiciosClient'

export default async function ServiciosPage() {
  const { tenantId } = await requireTenantId()

  const services = await prisma.service.findMany({
    where: { tenantId },
    select: { id: true, name: true, description: true, price: true, imageUrl: true },
    orderBy: { createdAt: 'asc' },
  })

  const serialized = services.map((s) => ({
    ...s,
    price: s.price !== null ? Number(s.price) : null,
  }))

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <ServiciosClient services={serialized} />
    </div>
  )
}
