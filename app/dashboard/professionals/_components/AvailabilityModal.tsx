'use client'
import { useState, useEffect, useTransition } from 'react'
import {
  getSchedule,
  saveSchedule,
  getBlackouts,
  createBlackout,
  deleteBlackout,
  type ScheduleDay,
  type BlackoutItem,
} from '@/app/actions/availability'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon → Sun

const DEFAULT_DAYS: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isWorkingDay: i >= 1 && i <= 5,
  startHour: 8,
  endHour: 20,
}))

function HourSelect({ value, onChange, disabled }: { value: number; onChange: (h: number) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 bg-white disabled:bg-zinc-50 disabled:text-zinc-400 disabled:border-zinc-200"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
      ))}
    </select>
  )
}

function formatDateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  professionalId: string
  professionalEmail: string
  onClose: () => void
}

export default function AvailabilityModal({ professionalId, professionalEmail, onClose }: Props) {
  const [tab, setTab] = useState<'schedule' | 'blackouts'>('schedule')

  // ── Schedule state ───────────────────────────────────────────────────────────
  const [days, setDays] = useState<ScheduleDay[]>(DEFAULT_DAYS)
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [savingSchedule, startScheduleTransition] = useTransition()

  // ── Blackouts state ──────────────────────────────────────────────────────────
  const [blackouts, setBlackouts] = useState<BlackoutItem[] | null>(null)
  const [blackoutError, setBlackoutError] = useState<string | null>(null)
  const [blackoutSaved, setBlackoutSaved] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [savingBlackout, startBlackoutTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, startDeleteTransition] = useTransition()

  useEffect(() => {
    getSchedule(professionalId).then((rows) => {
      if (rows.length > 0) {
        setDays((prev) =>
          prev.map((d) => {
            const row = rows.find((r) => r.dayOfWeek === d.dayOfWeek)
            return row ? { ...d, ...row } : d
          })
        )
      }
      setLoadingSchedule(false)
    })
    getBlackouts(professionalId).then(setBlackouts)
  }, [professionalId])

  function updateDay(dayOfWeek: number, patch: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)))
    setScheduleSaved(false)
  }

  function handleSaveSchedule() {
    setScheduleError(null)
    startScheduleTransition(async () => {
      const fd = new FormData()
      fd.set('professionalId', professionalId)
      days.forEach((d) => {
        fd.set(`working_${d.dayOfWeek}`, d.isWorkingDay ? 'true' : 'false')
        fd.set(`start_${d.dayOfWeek}`, String(d.startHour))
        fd.set(`end_${d.dayOfWeek}`, String(d.endHour))
      })
      const result = await saveSchedule(undefined, fd)
      if (result?.error) setScheduleError(result.error)
      else setScheduleSaved(true)
    })
  }

  function handleAddBlackout() {
    if (!startDate || !endDate) return
    setBlackoutError(null)
    startBlackoutTransition(async () => {
      const fd = new FormData()
      fd.set('professionalId', professionalId)
      fd.set('startDate', startDate)
      fd.set('endDate', endDate)
      fd.set('reason', reason)
      const result = await createBlackout(undefined, fd)
      if (result?.error) {
        setBlackoutError(result.error)
      } else {
        setBlackoutSaved(true)
        setStartDate('')
        setEndDate('')
        setReason('')
        getBlackouts(professionalId).then(setBlackouts)
      }
    })
  }

  function handleDeleteBlackout(id: string) {
    setDeletingId(id)
    startDeleteTransition(async () => {
      await deleteBlackout(id)
      setBlackouts((prev) => prev?.filter((b) => b.id !== id) ?? null)
      setDeletingId(null)
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">Disponibilidad</h2>
            <p className="text-xs text-zinc-400 truncate">{professionalEmail}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 flex-shrink-0">
          {(['schedule', 'blackouts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition cursor-pointer ${
                tab === t ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {t === 'schedule' ? 'Horario semanal' : 'Fechas bloqueadas'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── Schedule tab ── */}
          {tab === 'schedule' && (
            <div className="px-5 py-5 flex flex-col gap-4">
              {loadingSchedule ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500">
                    Configurá los días y horarios en que este profesional atiende. Los slots del booking público se generarán dentro de estos rangos.
                  </p>

                  <div className="flex flex-col gap-2">
                    {DAY_ORDER.map((dow) => {
                      const d = days.find((x) => x.dayOfWeek === dow)!
                      return (
                        <div key={dow} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition ${d.isWorkingDay ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50'}`}>
                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => updateDay(dow, { isWorkingDay: !d.isWorkingDay })}
                            className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-200 cursor-pointer focus:outline-none ${d.isWorkingDay ? 'bg-zinc-800' : 'bg-zinc-200'}`}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${d.isWorkingDay ? 'left-5' : 'left-1'}`} />
                          </button>

                          {/* Day name */}
                          <span className={`text-sm font-medium w-8 flex-shrink-0 ${d.isWorkingDay ? 'text-zinc-800' : 'text-zinc-400'}`}>
                            {DAY_NAMES[dow]}
                          </span>

                          {/* Hours */}
                          {d.isWorkingDay ? (
                            <div className="flex items-center gap-2 flex-1">
                              <HourSelect value={d.startHour} onChange={(h) => updateDay(dow, { startHour: h })} />
                              <span className="text-xs text-zinc-400">—</span>
                              <HourSelect value={d.endHour} onChange={(h) => updateDay(dow, { endHour: h })} />
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 flex-1">No trabaja</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {scheduleError && (
                    <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{scheduleError}</p>
                  )}

                  <button
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
                  >
                    {savingSchedule ? 'Guardando…' : scheduleSaved ? 'Guardado ✓' : 'Guardar horario'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Blackouts tab ── */}
          {tab === 'blackouts' && (
            <div className="px-5 py-5 flex flex-col gap-5">
              {/* Existing blackouts */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-zinc-900">Bloqueos activos</p>
                {blackouts === null ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  </div>
                ) : blackouts.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-2">Sin fechas bloqueadas.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {blackouts.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 bg-white">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-800 font-medium">
                            {formatDateLocal(b.startDate)}
                            {b.startDate !== b.endDate && ` → ${formatDateLocal(b.endDate)}`}
                          </p>
                          {b.reason && <p className="text-xs text-zinc-400 mt-0.5 truncate">{b.reason}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteBlackout(b.id)}
                          disabled={deleting && deletingId === b.id}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition disabled:opacity-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100" />

              {/* Add blackout form */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-zinc-900">Agregar bloqueo</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-600">Desde</label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => { setStartDate(e.target.value); setBlackoutSaved(false) }}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-600">Hasta</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => { setEndDate(e.target.value); setBlackoutSaved(false) }}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Vacaciones, feriado…"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                {blackoutError && (
                  <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{blackoutError}</p>
                )}

                <button
                  onClick={handleAddBlackout}
                  disabled={savingBlackout || !startDate || !endDate}
                  className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  {savingBlackout ? 'Guardando…' : blackoutSaved ? 'Agregado ✓' : 'Agregar bloqueo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
