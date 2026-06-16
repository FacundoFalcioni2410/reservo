import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import ServicesClient from './_components/ServicesClient'
import PageHeader from '../_components/PageHeader'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export default async function ServicesPage() {
  const { tenantId, userId, role } = await requireTenantId()
  const isPro = role === 'professional'

  if (isPro) {
    const services = await prisma.service.findMany({
      where: { professionals: { some: { id: userId } } },
      select: { id: true, name: true, description: true, price: true, duration: true },
      orderBy: { name: 'asc' },
    })

    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
        <PageHeader title="Mis servicios" description={`${services.length} servicio${services.length !== 1 ? 's' : ''} asignado${services.length !== 1 ? 's' : ''}`} />
        {services.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">Todavía no tenés servicios asignados. Pedile al administrador que te asigne uno.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-zinc-400 mt-0.5 truncate">{s.description}</p>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-zinc-700">{formatDuration(s.duration)}</p>
                  {s.price != null && <p className="text-xs text-zinc-400 mt-0.5">${Number(s.price).toLocaleString('es-AR')}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const services = await prisma.service.findMany({
    where: { tenantId },
    select: { id: true, name: true, description: true, price: true, imageUrl: true, duration: true },
    orderBy: { createdAt: 'asc' },
  })

  const serialized = services.map((s) => ({ ...s, price: s.price !== null ? Number(s.price) : null }))

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <ServicesClient services={serialized} />
    </div>
  )
}
