import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminEventDetail } from '@/app/actions/events'
import { cancelOccurrence } from '@/app/actions/events'
import PageHeader from '../../_components/PageHeader'
import OccurrenceCancelButton from './_components/OccurrenceCancelButton'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const data = await getAdminEventDetail(eventId)
  if (!data) redirect('/dashboard/eventos')

  const { event, upcomingDates } = data

  const recurrenceLabel = event.recurrenceType === 'ONCE'
    ? 'Una vez'
    : `Semanal — ${DAYS.filter((_, i) => event.recurrenceDays & (1 << i)).join(', ')}`

  // Build map of occurrences by date string for quick lookup
  const occurrenceByDate = new Map(
    event.occurrences.map((o) => [o.date.toISOString().slice(0, 10), o])
  )

  // Show all upcoming dates + any past occurrences that have attendees
  const pastWithAttendees = event.occurrences.filter((o) => {
    const dateStr = o.date.toISOString().slice(0, 10)
    return !upcomingDates.includes(dateStr) && o.attendees.length > 0
  })

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/eventos" className="text-sm text-zinc-400 hover:text-zinc-700 transition">
          ← Eventos
        </Link>
      </div>

      <PageHeader
        title={event.title}
        description={`${recurrenceLabel} · ${event.time} · Máx. ${event.maxAttendees} personas`}
      />

      {/* Upcoming occurrences */}
      <h2 className="text-sm font-semibold text-zinc-700 mb-3 mt-6">Próximas fechas</h2>
      {upcomingDates.length === 0 ? (
        <p className="text-sm text-zinc-400">No hay próximas fechas disponibles.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {upcomingDates.map((dateStr) => {
            const occ = occurrenceByDate.get(dateStr)
            const confirmed = occ?.attendees.filter((a) => a.status === 'CONFIRMED') ?? []
            const waitlisted = occ?.attendees.filter((a) => a.status === 'WAITLISTED') ?? []
            return (
              <div key={dateStr} className={`bg-white rounded-xl border border-zinc-200 p-4 ${occ?.isCancelled ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 capitalize">{formatDate(dateStr)}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {confirmed.length} confirmado{confirmed.length !== 1 ? 's' : ''}
                      {waitlisted.length > 0 && ` · ${waitlisted.length} en espera`}
                      {' · '}de {event.maxAttendees}
                    </p>
                    {occ?.isCancelled && (
                      <span className="inline-block mt-1 text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">Cancelada</span>
                    )}
                  </div>
                  {occ && !occ.isCancelled && (
                    <OccurrenceCancelButton occurrenceId={occ.id} />
                  )}
                </div>

                {occ && occ.attendees.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex flex-col gap-1">
                    {occ.attendees.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-xs text-zinc-600">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === 'CONFIRMED' ? 'bg-green-500' : a.status === 'WAITLISTED' ? 'bg-yellow-400' : 'bg-zinc-300'}`} />
                        <span className="font-medium">{a.clientName}</span>
                        <span className="text-zinc-400">{a.clientEmail}</span>
                        {a.clientPhone && <span className="text-zinc-400">{a.clientPhone}</span>}
                        {a.status === 'WAITLISTED' && <span className="text-yellow-600">(en espera)</span>}
                        {a.status === 'CANCELLED' && <span className="text-zinc-400 line-through">cancelado</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Past occurrences with attendees */}
      {pastWithAttendees.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-zinc-700 mb-3 mt-8">Fechas pasadas</h2>
          <div className="flex flex-col gap-2">
            {pastWithAttendees.map((occ) => {
              const dateStr = occ.date.toISOString().slice(0, 10)
              const confirmed = occ.attendees.filter((a) => a.status === 'CONFIRMED')
              return (
                <div key={occ.id} className="bg-white rounded-xl border border-zinc-200 p-4 opacity-70">
                  <p className="text-sm font-medium text-zinc-900 capitalize">{formatDate(dateStr)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{confirmed.length} asistente{confirmed.length !== 1 ? 's' : ''}</p>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex flex-col gap-1">
                    {occ.attendees.filter((a) => a.status !== 'CANCELLED').map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-xs text-zinc-600">
                        <span className="font-medium">{a.clientName}</span>
                        <span className="text-zinc-400">{a.clientEmail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
