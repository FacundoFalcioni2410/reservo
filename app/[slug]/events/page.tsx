import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicEvents } from '@/app/actions/publicEvents'

function formatNextDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default async function EventsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const events = await getPublicEvents(slug)
  if (events === null) notFound()

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href={`/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-700 transition">
            ← Volver
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-6">Eventos</h1>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">No hay eventos disponibles por el momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/${slug}/eventos/${ev.id}`}
                className="bg-white rounded-xl border border-zinc-200 flex flex-col hover:border-zinc-300 hover:shadow-md transition group overflow-hidden"
              >
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-44 object-cover group-hover:brightness-95 transition" />
                ) : (
                  <div className="w-full h-28 bg-zinc-100 flex items-center justify-center text-zinc-300">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1 flex flex-col p-4">
                  <p className="text-sm font-semibold text-zinc-900">{ev.title}</p>
                  {ev.description && (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{ev.description}</p>
                  )}
                  <div className="mt-auto pt-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-zinc-600">
                        {ev.recurrenceType === 'ONCE'
                          ? formatNextDate(new Date(ev.startDate).toISOString().slice(0, 10))
                          : `Cada ${DAYS.filter((_, i) => ev.recurrenceDays & (1 << i)).join(', ')}`}
                      </span>
                      <span className="text-xs text-zinc-400">· {ev.time}</span>
                    </div>
                    {ev.recurrenceType === 'WEEKLY' && ev.nextDates.length > 0 && (
                      <p className="text-xs text-zinc-400">Próxima: {formatNextDate(ev.nextDates[0])}</p>
                    )}
                    {ev.location && (
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {ev.location}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
