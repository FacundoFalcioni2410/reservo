import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function ClientesPage() {
  const { tenantId } = await requireTenantId()

  // Aggregate clients from bookings — one row per unique clientEmail
  const rows = await prisma.booking.groupBy({
    by: ['clientEmail'],
    where: { tenantId, clientEmail: { not: null } },
    _count: { id: true },
    _max: { clientName: true, clientPhone: true, startTime: true },
    orderBy: { _max: { startTime: 'desc' } },
  })

  // Also include bookings without email (captured by name only)
  const noEmailRows = await prisma.booking.findMany({
    where: { tenantId, clientEmail: null },
    select: { id: true, clientName: true, clientPhone: true, startTime: true },
    orderBy: { startTime: 'desc' },
    distinct: ['clientName'],
  })

  const clients = [
    ...rows.map((r) => ({
      key: r.clientEmail!,
      name: r._max.clientName ?? r.clientEmail!,
      email: r.clientEmail!,
      phone: r._max.clientPhone ?? null,
      bookingCount: r._count.id,
      lastBooking: r._max.startTime,
    })),
    ...noEmailRows.map((r) => ({
      key: r.id,
      name: r.clientName,
      email: null,
      phone: r.clientPhone ?? null,
      bookingCount: null,
      lastBooking: r.startTime,
    })),
  ]

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Clientes"
        description={`${rows.length} cliente${rows.length !== 1 ? 's' : ''} registrado${rows.length !== 1 ? 's' : ''}`}
      />

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">
            Todavía no hay clientes. Aparecerán acá cuando alguien haga una reserva.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clients.map((c) => (
            <div
              key={c.key}
              className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600 flex-shrink-0">
                {initials(c.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {c.email && (
                    <p className="text-xs text-zinc-400 truncate">{c.email}</p>
                  )}
                  {c.phone && (
                    <p className="text-xs text-zinc-400">{c.phone}</p>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex-shrink-0 text-right">
                {c.bookingCount !== null && (
                  <p className="text-xs font-medium text-zinc-700">
                    {c.bookingCount} {c.bookingCount === 1 ? 'reserva' : 'reservas'}
                  </p>
                )}
                {c.lastBooking && (
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(c.lastBooking)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
