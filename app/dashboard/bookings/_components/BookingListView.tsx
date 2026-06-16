'use client'
import Link from 'next/link'

type BookingItem = {
  id: string
  clientName: string
  clientPhone: string | null
  serviceName: string | null
  startTime: string
  endTime: string
  status: string
  professionalId: string | null
}

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600' },
}

function Section({ title, bookings }: { title: string; bookings: BookingItem[] }) {
  if (bookings.length === 0) return null
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">{title} ({bookings.length})</p>
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {bookings.map((b) => {
          const s = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-zinc-100 text-zinc-600' }
          return (
            <div key={b.id} className="px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{b.clientName}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {b.serviceName && <span>{b.serviceName} · </span>}
                  {formatDateTime(b.startTime)}
                </p>
                {b.clientPhone && <p className="text-xs text-zinc-400">{b.clientPhone}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BookingListView({ upcoming, past }: { upcoming: BookingItem[]; past: BookingItem[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/dashboard/bookings"
          className="text-sm px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition font-medium"
        >
          ← Vista semana
        </Link>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">No tenés turnos registrados.</p>
        </div>
      ) : (
        <>
          <Section title="Próximos" bookings={upcoming} />
          <Section title="Pasados" bookings={past} />
        </>
      )}
    </div>
  )
}
