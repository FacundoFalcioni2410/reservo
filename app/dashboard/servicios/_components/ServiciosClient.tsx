'use client'
import { useState, useTransition, useActionState, useEffect } from 'react'
import PageHeader from '../../_components/PageHeader'
import DeleteConfirm from '../../_components/DeleteConfirm'
import { createService, updateService, deleteService } from '@/app/actions/services'

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} hora${h > 1 ? 's' : ''}`
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  imageUrl: string | null
  duration: number
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

// ─── Modal ────────────────────────────────────────────────────────────────────

function ServiceModal({ service, onClose }: { service?: Service; onClose: () => void }) {
  const action = service ? updateService : createService
  const [state, formAction, pending] = useActionState(action, undefined)

  const initDuration = service?.duration ?? 60
  const [durationHours, setDurationHours] = useState(Math.floor(initDuration / 60))
  const [durationMins, setDurationMins] = useState(initDuration % 60)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {service ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="px-5 py-5 flex flex-col gap-4">
          {service && <input type="hidden" name="id" value={service.id} />}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={service?.name}
              placeholder="Ej: Corte de cabello"
              className={INPUT_CLASS}
            />
            {state?.errors?.name && <p className="text-xs text-red-600">{state.errors.name[0]}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Descripción</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={service?.description ?? ''}
              placeholder="Descripción opcional del servicio"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Precio</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service?.price ?? ''}
                placeholder="0.00"
                className={`${INPUT_CLASS} pl-7`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Duración</label>
            <input type="hidden" name="duration" value={durationHours * 60 + durationMins} />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Horas</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className={INPUT_CLASS}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i}>{i}h</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Minutos</label>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className={INPUT_CLASS}
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>
            {durationHours === 0 && durationMins === 0 && (
              <p className="text-xs text-red-500">La duración debe ser mayor a 0.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">URL de imagen</label>
            <input
              name="imageUrl"
              type="url"
              defaultValue={service?.imageUrl ?? ''}
              placeholder="https://..."
              className={INPUT_CLASS}
            />
            <p className="text-xs text-zinc-400">Pegá un link directo a una imagen (jpg, png, webp)</p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
          >
            {pending ? 'Guardando…' : service ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ServiciosClient({ services }: { services: Service[] }) {
  const [modal, setModal] = useState<'create' | Service | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteService(id)
      setConfirmId(null)
    })
  }

  function formatPrice(price: number | null) {
    if (price === null) return null
    return `$ ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Catálogo de servicios del negocio"
        action={
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-700 cursor-pointer transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        }
      />

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400 mb-3">Todavía no hay servicios.</p>
          <button
            onClick={() => setModal('create')}
            className="text-sm font-medium text-zinc-900 underline underline-offset-2 cursor-pointer"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                {/* Image */}
                <div className="w-14 h-14 rounded-lg bg-zinc-100 flex-shrink-0 overflow-hidden">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {s.price !== null && (
                          <span className="text-sm font-medium text-zinc-700">{formatPrice(s.price)}</span>
                        )}
                        <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {formatDuration(s.duration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {confirmId === s.id ? (
                        <DeleteConfirm
                          onConfirm={() => handleDelete(s.id)}
                          onCancel={() => setConfirmId(null)}
                          disabled={isPending}
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => setModal(s)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                            aria-label="Editar"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmId(s.id)}
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
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ServiceModal
          key={modal === 'create' ? 'create' : modal.id}
          service={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
