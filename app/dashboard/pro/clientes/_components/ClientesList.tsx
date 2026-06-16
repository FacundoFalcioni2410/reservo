'use client'
import { useState } from 'react'

type Booking = {
  id: string
  serviceName: string | null
  startTime: string
  status: string
}

type Client = {
  key: string
  name: string
  email: string | null
  phone: string | null
  bookings: Booking[]
}

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
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

export default function ClientesList({ clients }: { clients: Client[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">Todavía no tenés clientes. Aparecerán acá cuando tengas reservas.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {clients.map((c) => {
        const isOpen = expanded === c.key
        return (
          <div key={c.key} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : c.key)}
              className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-zinc-50 transition-colors"
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

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-zinc-500">{c.bookings.length} {c.bookings.length === 1 ? 'reserva' : 'reservas'}</span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                {c.bookings.map((b) => {
                  const s = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-zinc-100 text-zinc-600' }
                  return (
                    <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800 truncate">{b.serviceName ?? 'Sin servicio'}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{formatDate(b.startTime)} · {formatTime(b.startTime)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
