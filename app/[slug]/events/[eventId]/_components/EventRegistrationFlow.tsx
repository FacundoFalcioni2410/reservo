'use client'
import { useState, useTransition } from 'react'
import { registerForOccurrence } from '@/app/actions/publicEvents'

type OccurrenceInfo = {
  date: string
  confirmedCount: number
  pendingCount: number
  availableCount: number
  isFull: boolean
}

type Props = {
  tenantSlug: string
  eventId: string
  tenantName: string
  upcomingDates: OccurrenceInfo[]
  eventTime: string
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
}

function CapacityBadges({ occ, selected }: { occ: OccurrenceInfo; selected: boolean }) {
  return (
    <div className={`flex gap-2 mt-1 flex-wrap text-xs ${selected ? 'opacity-80' : ''}`}>
      {occ.confirmedCount > 0 && (
        <span className={`flex items-center gap-1 ${selected ? 'text-green-300' : 'text-green-600'}`}>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
          {occ.confirmedCount} confirmado{occ.confirmedCount !== 1 ? 's' : ''}
        </span>
      )}
      {occ.pendingCount > 0 && (
        <span className={`flex items-center gap-1 ${selected ? 'text-yellow-200' : 'text-yellow-600'}`}>
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block" />
          {occ.pendingCount} pendiente{occ.pendingCount !== 1 ? 's' : ''}
        </span>
      )}
      {!occ.isFull && (
        <span className={selected ? 'text-zinc-300' : 'text-zinc-400'}>
          {occ.availableCount} lugar{occ.availableCount !== 1 ? 'es' : ''} disponible{occ.availableCount !== 1 ? 's' : ''}
        </span>
      )}
      {occ.isFull && (
        <span className={selected ? 'text-red-300' : 'text-red-500'}>Sin lugares</span>
      )}
    </div>
  )
}

export default function EventRegistrationFlow({ tenantSlug, eventId, tenantName, upcomingDates, eventTime }: Props) {
  const [selected, setSelected] = useState<OccurrenceInfo | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<{ status: 'PENDING_CONFIRMATION' | 'WAITLISTED' } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    startTransition(async () => {
      const res = await registerForOccurrence(tenantSlug, eventId, selected.date, name, email, phone)
      setResult(res as { status: 'PENDING_CONFIRMATION' | 'WAITLISTED' } | { error: string })
    })
  }

  if (result && 'status' in result) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center">
        {result.status === 'PENDING_CONFIRMATION' ? (
          <>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-900">¡Revisá tu email!</h2>
            <p className="text-sm text-zinc-500 mt-1">Te enviamos un link para confirmar tu lugar. Tenés 1 hora para confirmar, si no tu lugar se libera automáticamente.</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-900">Estás en lista de espera</h2>
            <p className="text-sm text-zinc-500 mt-1">El evento está lleno. Si se libera un lugar te avisamos por email y tendrás 1 hora para confirmar.</p>
          </>
        )}
        <button
          onClick={() => { setResult(null); setSelected(null); setName(''); setEmail(''); setPhone('') }}
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-2 cursor-pointer"
        >
          Inscribir otra persona
        </button>
      </div>
    )
  }

  if (upcomingDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center">
        <p className="text-sm text-zinc-400">No hay fechas disponibles para este evento.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Date selection */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-800 mb-3">Elegí una fecha</h2>
        <div className="flex flex-col gap-2">
          {upcomingDates.map((occ) => (
            <button
              key={occ.date}
              type="button"
              onClick={() => setSelected(occ)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition cursor-pointer
                ${selected?.date === occ.date
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : occ.isFull
                    ? 'border-zinc-200 bg-zinc-50/50 text-zinc-500'
                    : 'border-zinc-200 hover:border-zinc-400 text-zinc-700'
                }`}
            >
              <div className="font-medium capitalize">{formatDate(occ.date)} · {eventTime}</div>
              <CapacityBadges occ={occ} selected={selected?.date === occ.date} />
              {occ.isFull && selected?.date !== occ.date && (
                <p className="text-xs mt-1 text-zinc-400">Podés anotarte en lista de espera</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Registration form */}
      {selected && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-1">
            {selected.isFull ? 'Anotate en lista de espera' : 'Tus datos'}
          </h2>
          {!selected.isFull && (
            <p className="text-xs text-zinc-400 mb-3">Te enviaremos un email para confirmar tu lugar.</p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
            {result && 'error' in result && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{result.error}</p>
            )}
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre *" className={INPUT_CLASS} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Tu email *" className={INPUT_CLASS} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Tu teléfono (opcional)" className={INPUT_CLASS} />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
            >
              {isPending
                ? 'Procesando…'
                : selected.isFull
                  ? 'Anotarme en lista de espera'
                  : 'Solicitar inscripción'
              }
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
