import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicEventDetail } from '@/app/actions/publicEvents'
import EventRegistrationFlow from './_components/EventRegistrationFlow'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`
  return `${h} h ${m} min`
}

export default async function EventDetailPublicPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>
}) {
  const { slug, eventId } = await params
  const data = await getPublicEventDetail(slug, eventId)
  if (!data) notFound()

  const { event, tenantName, upcomingDates } = data

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5">
          <Link href={`/${slug}/eventos`} className="text-sm text-zinc-400 hover:text-zinc-700 transition">
            ← Eventos
          </Link>
        </div>

        {/* Two-column layout on desktop */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">

          {/* Left col: event info */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="w-full h-56 lg:h-72 object-cover" />
              )}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-zinc-900">{event.title}</h1>
                {event.description && (
                  <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{event.description}</p>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{formatDuration(event.durationMinutes)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Máx. {event.maxAttendees} personas por fecha</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming dates summary (desktop sidebar complement) */}
            <div className="lg:hidden bg-white rounded-xl border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold text-zinc-800 mb-3">Disponibilidad</h2>
              <div className="flex flex-col gap-2">
                {upcomingDates.slice(0, 5).map((occ) => (
                  <div key={occ.date} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 capitalize">{formatDate(occ.date)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">{occ.confirmedCount} conf.</span>
                      {occ.pendingCount > 0 && <span className="text-yellow-600">{occ.pendingCount} pend.</span>}
                      <span className={occ.isFull ? 'text-red-500' : 'text-zinc-400'}>
                        {occ.isFull ? 'Lleno' : `${occ.availableCount} disp.`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col: registration */}
          <div className="lg:col-span-2 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-6">
              <EventRegistrationFlow
                tenantSlug={slug}
                eventId={event.id}
                tenantName={tenantName}
                upcomingDates={upcomingDates}
                eventTime={event.time}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
