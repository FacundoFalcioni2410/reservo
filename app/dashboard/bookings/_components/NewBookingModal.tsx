'use client'
import { useActionState, useEffect, useState } from 'react'
import { createBooking } from '@/app/actions/bookings'

type Service = { id: string; name: string }
type Professional = { id: string; email: string; services: Service[] }

type Props = {
  professionals: Professional[]
  defaultDate?: string
  defaultStartTime?: string
  defaultEndTime?: string
  onClose: () => void
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

const SELECT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent w-full bg-white'

const SELECT_DISABLED_CLASS =
  'rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 w-full bg-zinc-50 cursor-not-allowed'

export default function NewBookingModal({
  professionals,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onClose,
}: Props) {
  const [state, action, pending] = useActionState(createBooking, undefined)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success])

  const selectedProfessional = professionals.find((p) => p.id === selectedProfessionalId)
  const availableServices = selectedProfessional?.services ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
          <h2 className="text-base font-semibold text-zinc-900">Nueva reserva</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={action} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Nombre del cliente <span className="text-red-500">*</span>
            </label>
            <input name="clientName" type="text" required placeholder="Ej: María González" className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Teléfono</label>
            <input name="clientPhone" type="tel" placeholder="+54 11 1234-5678" className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input name="date" type="date" required defaultValue={defaultDate} className={INPUT_CLASS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Inicio <span className="text-red-500">*</span>
              </label>
              <input name="startTime" type="time" required defaultValue={defaultStartTime} className={INPUT_CLASS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Fin <span className="text-red-500">*</span>
              </label>
              <input name="endTime" type="time" required defaultValue={defaultEndTime} className={INPUT_CLASS} />
            </div>
          </div>

          {professionals.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">Profesional</label>
              <select
                name="professionalId"
                className={SELECT_CLASS}
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.email}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Servicio</label>
            {selectedProfessionalId ? (
              <select name="serviceId" className={SELECT_CLASS}>
                <option value="">Sin especificar</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <select disabled className={SELECT_DISABLED_CLASS}>
                <option>Primero elegí un profesional</option>
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Notas</label>
            <textarea name="notes" rows={2} placeholder="Información adicional..." className={`${INPUT_CLASS} resize-none`} />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            {pending ? 'Guardando…' : 'Crear reserva'}
          </button>
        </form>
      </div>
    </div>
  )
}
