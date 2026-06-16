'use client'
import { useState, useEffect } from 'react'
import { getBookingsForClient } from '@/app/actions/bookings'

type AdminClient = {
  key: string
  name: string
  email: string | null
  phone: string | null
  bookingCount: number | null
  lastBooking: Date | null
}

type BookingItem = {
  id: string
  serviceName: string | null
  startTime: string
  endTime: string
  status: string
}

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600' },
}

function ClientBookingsModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const [bookings, setBookings] = useState<BookingItem[] | null>(null)

  useEffect(() => {
    getBookingsForClient(client.email, client.name).then(setBookings)
  }, [client.key])

  const now = new Date().toISOString()
  const upcoming = bookings?.filter((b) => b.startTime >= now) ?? []
  const past = bookings?.filter((b) => b.startTime < now).reverse() ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">{client.name}</h2>
            {client.email && <p className="text-xs text-zinc-400 truncate">{client.email}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {bookings === null ? (
            <p className="text-sm text-zinc-400 text-center py-10">Cargando…</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">Este cliente no tiene turnos.</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 border-b border-zinc-100">
                    Próximos ({upcoming.length})
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {upcoming.map((b) => {
                      const s = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-zinc-100 text-zinc-600' }
                      return (
                        <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 truncate">{b.serviceName ?? 'Sin servicio'}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{formatDate(b.startTime)} · {formatTime(b.startTime)}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 border-b border-zinc-100">
                    Pasados ({past.length})
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {past.map((b) => {
                      const s = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-zinc-100 text-zinc-600' }
                      return (
                        <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 truncate">{b.serviceName ?? 'Sin servicio'}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{formatDate(b.startTime)} · {formatTime(b.startTime)}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientsAdminList({ clients }: { clients: AdminClient[] }) {
  const [selected, setSelected] = useState<AdminClient | null>(null)

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">Todavía no hay clientes. Aparecerán acá cuando alguien haga una reserva.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {clients.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelected(c)}
            className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5 flex items-center gap-3 text-left hover:border-zinc-300 hover:shadow-sm transition w-full"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-600 flex-shrink-0">
              {initials(c.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {c.email && <p className="text-xs text-zinc-400 truncate">{c.email}</p>}
                {c.phone && <p className="text-xs text-zinc-400">{c.phone}</p>}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              {c.bookingCount !== null && (
                <p className="text-xs font-medium text-zinc-700">{c.bookingCount} {c.bookingCount === 1 ? 'reserva' : 'reservas'}</p>
              )}
              {c.lastBooking && (
                <p className="text-xs text-zinc-400 mt-0.5">{formatDate(c.lastBooking)}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <ClientBookingsModal
          key={selected.key}
          client={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
