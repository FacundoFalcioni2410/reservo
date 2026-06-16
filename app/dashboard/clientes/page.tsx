import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'
import ClientesList from '../pro/clientes/_components/ClientesList'
import ClientesAdminList from './_components/ClientesAdminList'


export default async function ClientesPage() {
  const { tenantId, userId, role } = await requireTenantId()
  const isPro = role === 'professional'

  if (isPro) {
    const bookings = await prisma.booking.findMany({
      where: { tenantId, professionalId: userId },
      select: { id: true, clientName: true, clientEmail: true, clientPhone: true, serviceName: true, startTime: true, status: true },
      orderBy: { startTime: 'desc' },
    })

    const clientMap = new Map<string, { key: string; name: string; email: string | null; phone: string | null; bookings: { id: string; serviceName: string | null; startTime: string; status: string }[] }>()
    for (const b of bookings) {
      const key = b.clientEmail ?? `name:${b.clientName}`
      if (!clientMap.has(key)) clientMap.set(key, { key, name: b.clientName, email: b.clientEmail ?? null, phone: b.clientPhone ?? null, bookings: [] })
      clientMap.get(key)!.bookings.push({ id: b.id, serviceName: b.serviceName, startTime: b.startTime.toISOString(), status: b.status })
    }
    const clients = Array.from(clientMap.values())

    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
        <PageHeader title="Mis clientes" description={`${clients.length} cliente${clients.length !== 1 ? 's' : ''}`} />
        <ClientesList clients={clients} />
      </div>
    )
  }

  // Admin view
  const rows = await prisma.booking.groupBy({
    by: ['clientEmail'],
    where: { tenantId, clientEmail: { not: null } },
    _count: { id: true },
    _max: { clientName: true, clientPhone: true, startTime: true },
    orderBy: { _max: { startTime: 'desc' } },
  })

  const noEmailRows = await prisma.booking.findMany({
    where: { tenantId, clientEmail: null },
    select: { id: true, clientName: true, clientPhone: true, startTime: true },
    orderBy: { startTime: 'desc' },
    distinct: ['clientName'],
  })

  const clients = [
    ...rows.map((r) => ({ key: r.clientEmail!, name: r._max.clientName ?? r.clientEmail!, email: r.clientEmail!, phone: r._max.clientPhone ?? null, bookingCount: r._count.id, lastBooking: r._max.startTime })),
    ...noEmailRows.map((r) => ({ key: r.id, name: r.clientName, email: null, phone: r.clientPhone ?? null, bookingCount: null, lastBooking: r.startTime })),
  ]

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <PageHeader title="Clientes" description={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`} />

      <ClientesAdminList clients={clients} />
    </div>
  )
}
