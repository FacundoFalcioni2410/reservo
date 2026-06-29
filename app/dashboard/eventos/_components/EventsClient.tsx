'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import PageHeader from '../../_components/PageHeader'
import DeleteConfirm from '../../_components/DeleteConfirm'
import Modal from '@/app/ui/Modal'
import { createEvent, updateEvent, deleteEvent, toggleEventActive } from '@/app/actions/events'
import type { Event, RecurrenceType } from '@prisma/client'

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function recurrenceLabel(event: Event) {
  if (event.recurrenceType === 'ONCE') {
    return new Date(event.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  const days = DAYS.filter((_, i) => event.recurrenceDays & (1 << i))
  return `Cada ${days.join(', ')}`
}

type Professional = { id: string; displayName: string }
type EventWithProfessionals = Event & { professionals: { id: string; email: string }[] }

// ─── Modal ────────────────────────────────────────────────────────────────────

function EventModal({
  event,
  professionals,
  onClose,
}: {
  event?: EventWithProfessionals
  professionals: Professional[]
  onClose: () => void
}) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>(event?.recurrenceType ?? 'ONCE')
  const [daysBitmask, setDaysBitmask] = useState(event?.recurrenceDays ?? 0)
  const [durationHours, setDurationHours] = useState(Math.floor((event?.durationMinutes ?? 60) / 60))
  const [durationMins, setDurationMins] = useState((event?.durationMinutes ?? 60) % 60)
  const [selectedProfIds, setSelectedProfIds] = useState<Set<string>>(
    new Set(event?.professionals.map((p) => p.id) ?? [])
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleProfessional(id: string) {
    setSelectedProfIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleDay(bit: number) {
    setDaysBitmask((prev) => prev ^ bit)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('durationMinutes', String(durationHours * 60 + durationMins))
    fd.set('recurrenceType', recurrence)
    fd.set('recurrenceDays', String(daysBitmask))
    // append selected professionals
    fd.delete('professionalIds')
    selectedProfIds.forEach((id) => fd.append('professionalIds', id))
    const res = event ? await updateEvent(event.id, fd) : await createEvent(fd)
    if (res?.error) { setError(res.error); setPending(false); return }
    onClose()
  }

  const startDateDefault = event
    ? new Date(event.startDate).toISOString().slice(0, 10)
    : ''
  const endDateDefault = event?.endDate
    ? new Date(event.endDate).toISOString().slice(0, 10)
    : ''

  return (
    <Modal onClose={onClose} title={event ? 'Editar evento' : 'Nuevo evento'}>
      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Título <span className="text-red-500">*</span></label>
          <input name="title" required defaultValue={event?.title} placeholder="Ej: Clase de yoga" className={INPUT_CLASS} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Descripción</label>
          <textarea name="description" rows={3} defaultValue={event?.description ?? ''} placeholder="Descripción opcional" className={`${INPUT_CLASS} resize-none`} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Ubicación</label>
          <input name="location" defaultValue={event?.location ?? ''} placeholder="Dirección o link (Zoom, Meet...)" className={INPUT_CLASS} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Horario <span className="text-red-500">*</span></label>
            <input name="time" type="time" required defaultValue={event?.time ?? '09:00'} className={INPUT_CLASS} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Capacidad máx. <span className="text-red-500">*</span></label>
            <input name="maxAttendees" type="number" min="1" required defaultValue={event?.maxAttendees ?? 20} className={INPUT_CLASS} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Duración</label>
          <input type="hidden" name="durationMinutes" value={durationHours * 60 + durationMins} />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Horas</label>
              <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={INPUT_CLASS}>
                {Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Minutos</label>
              <select value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))} className={INPUT_CLASS}>
                {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">Recurrencia</label>
          <div className="flex gap-2">
            {(['ONCE', 'WEEKLY'] as RecurrenceType[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition border cursor-pointer ${recurrence === r ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'}`}
              >
                {r === 'ONCE' ? 'Una vez' : 'Semanal'}
              </button>
            ))}
          </div>

          {recurrence === 'ONCE' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Fecha del evento <span className="text-red-500">*</span></label>
              <input name="startDate" type="date" required defaultValue={startDateDefault} className={INPUT_CLASS} />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Días de la semana</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((d, i) => {
                    const bit = 1 << i
                    const active = (daysBitmask & bit) !== 0
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(bit)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'}`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Desde <span className="text-red-500">*</span></label>
                  <input name="startDate" type="date" required defaultValue={startDateDefault} className={INPUT_CLASS} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Hasta (opcional)</label>
                  <input name="endDate" type="date" defaultValue={endDateDefault} className={INPUT_CLASS} />
                </div>
              </div>
            </>
          )}
        </div>

        {professionals.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">Profesionales asignados</label>
            <div className="flex flex-col gap-1.5">
              {professionals.map((p) => {
                const checked = selectedProfIds.has(p.id)
                return (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProfessional(p.id)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <span className="text-sm text-zinc-700">{p.displayName}</span>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-zinc-400">El evento se bloqueará en su Google Calendar cuando alguien confirme asistencia.</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">URL de imagen</label>
          <input name="imageUrl" type="url" defaultValue={event?.imageUrl ?? ''} placeholder="https://..." className={INPUT_CLASS} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
        >
          {pending ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </form>
    </Modal>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EventsClient({ events, professionals }: { events: EventWithProfessionals[]; professionals: Professional[] }) {
  const [modal, setModal] = useState<'create' | EventWithProfessionals | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEvent(id)
      setConfirmId(null)
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(() => toggleEventActive(id, !current))
  }

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Gestioná los eventos con cupos del negocio"
        action={
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-700 cursor-pointer transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo evento</span>
          </button>
        }
      />

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400 mb-3">Todavía no hay eventos.</p>
          <button onClick={() => setModal('create')} className="text-sm font-medium text-zinc-900 underline underline-offset-2 cursor-pointer">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <div key={ev.id} className={`bg-white rounded-xl border border-zinc-200 p-4 flex items-start gap-3 ${!ev.isActive ? 'opacity-60' : ''}`}>
              {ev.imageUrl ? (
                <img src={ev.imageUrl} alt={ev.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-100 flex-shrink-0 flex items-center justify-center text-zinc-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{ev.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{recurrenceLabel(ev)} · {ev.time} · {formatDuration(ev.durationMinutes)}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Máx. {ev.maxAttendees} personas</p>
                    {!ev.isActive && <span className="inline-block mt-1 text-xs bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">Inactivo</span>}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {confirmId === ev.id ? (
                      <DeleteConfirm
                        onConfirm={() => handleDelete(ev.id)}
                        onCancel={() => setConfirmId(null)}
                        disabled={isPending}
                      />
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/eventos/${ev.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                          title="Ver asistentes"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleToggle(ev.id, ev.isActive)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                          title={ev.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {ev.isActive ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 12h.01"/><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3"/>
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 12h.01"/><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setModal(ev)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                          aria-label="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmId(ev.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                          aria-label="Eliminar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <EventModal
          key={modal === 'create' ? 'create' : modal.id}
          event={modal === 'create' ? undefined : modal}
          professionals={professionals}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
