'use client'
import { useState, useEffect, useTransition } from 'react'
import { getTenantBlackouts, createTenantBlackout, deleteBlackout, type BlackoutItem } from '@/app/actions/availability'

function formatDateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TenantBlackoutManager() {
  const [blackouts, setBlackouts] = useState<BlackoutItem[] | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, startSaveTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, startDeleteTransition] = useTransition()

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    getTenantBlackouts().then(setBlackouts)
  }, [])

  function handleAdd() {
    if (!startDate || !endDate) return
    setError(null)
    startSaveTransition(async () => {
      const fd = new FormData()
      fd.set('startDate', startDate)
      fd.set('endDate', endDate)
      fd.set('reason', reason)
      const result = await createTenantBlackout(undefined, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setStartDate('')
        setEndDate('')
        setReason('')
        getTenantBlackouts().then(setBlackouts)
      }
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startDeleteTransition(async () => {
      await deleteBlackout(id)
      setBlackouts((prev) => prev?.filter((b) => b.id !== id) ?? null)
      setDeletingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Existing blackouts */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Bloqueos activos</p>
          <p className="text-xs text-zinc-500 mt-0.5">El negocio no acepta reservas en estas fechas para ningún profesional.</p>
        </div>

        {blackouts === null ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        ) : blackouts.length === 0 ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">Sin fechas bloqueadas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {blackouts.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 bg-white">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 font-medium">
                    {formatDateLocal(b.startDate)}
                    {b.startDate !== b.endDate && <span className="text-zinc-400"> → </span>}
                    {b.startDate !== b.endDate && formatDateLocal(b.endDate)}
                  </p>
                  {b.reason && <p className="text-xs text-zinc-400 mt-0.5">{b.reason}</p>}
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
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

      {/* Add form */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-zinc-900">Agregar bloqueo</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">Desde</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => { setStartDate(e.target.value); setSaved(false) }}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-600">Hasta</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => { setEndDate(e.target.value); setSaved(false) }}
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
            placeholder="Vacaciones, feriado nacional…"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={saving || !startDate || !endDate}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
        >
          {saving ? 'Guardando…' : saved ? 'Agregado ✓' : 'Agregar bloqueo'}
        </button>
      </div>
    </div>
  )
}
