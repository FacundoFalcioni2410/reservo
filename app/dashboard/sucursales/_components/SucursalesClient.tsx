'use client'
import { useState, useTransition, useActionState, useEffect } from 'react'
import PageHeader from '../../_components/PageHeader'
import DeleteConfirm from '../../_components/DeleteConfirm'
import { createBranch, updateBranch, deleteBranch } from '@/app/actions/branches'

type Professional = { id: string; email: string }

type Branch = {
  id: string
  name: string
  address: string | null
  phone: string | null
  openTime: number | null
  closeTime: number | null
  professionals: Professional[]
  serviceIds: string[]
}

type TenantHours = { openTime: number; closeTime: number }
type ServiceItem = { id: string; name: string }

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
function hourLabel(h: number) { return `${String(h).padStart(2, '0')}:00` }
function pad2(n: number) { return String(n).padStart(2, '0') }

// ─── Branch form modal ────────────────────────────────────────────────────────

function BranchModal({
  branch,
  tenantHours,
  allServices,
  onClose,
}: {
  branch?: Branch
  tenantHours: TenantHours
  allServices: ServiceItem[]
  onClose: () => void
}) {
  const action = branch ? updateBranch : createBranch
  const [state, formAction, pending] = useActionState(action, undefined)
  const [overrideHours, setOverrideHours] = useState(
    branch ? branch.openTime !== null : false
  )

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {branch ? 'Editar sucursal' : 'Nueva sucursal'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="px-5 py-5 flex flex-col gap-4">
          {branch && <input type="hidden" name="id" value={branch.id} />}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input name="name" type="text" required defaultValue={branch?.name} placeholder="Ej: Sucursal Centro" className={INPUT_CLASS} />
            {state?.errors?.name && <p className="text-xs text-red-600">{state.errors.name[0]}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Dirección</label>
            <input name="address" type="text" defaultValue={branch?.address ?? ''} placeholder="Av. Corrientes 1234" className={INPUT_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Teléfono</label>
            <input name="phone" type="tel" defaultValue={branch?.phone ?? ''} placeholder="+54 11 1234-5678" className={INPUT_CLASS} />
          </div>

          {/* Hours override */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overrideHours}
                onChange={(e) => setOverrideHours(e.target.checked)}
                className="w-4 h-4 rounded accent-zinc-900"
              />
              <span className="text-sm font-medium text-zinc-700">Sobreescribir horario del negocio</span>
            </label>

            {overrideHours ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Apertura</label>
                  <select name="openTime" defaultValue={branch?.openTime ?? tenantHours.openTime} className={INPUT_CLASS}>
                    {HOURS.slice(0, 23).map((h) => (
                      <option key={h} value={h}>{hourLabel(h)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Cierre</label>
                  <select name="closeTime" defaultValue={branch?.closeTime ?? tenantHours.closeTime} className={INPUT_CLASS}>
                    {HOURS.slice(1).map((h) => (
                      <option key={h} value={h}>{hourLabel(h)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <input type="hidden" name="openTime" value="" />
                <input type="hidden" name="closeTime" value="" />
                <p className="text-xs text-zinc-400">
                  Se usará el horario del negocio: {hourLabel(tenantHours.openTime)} – {hourLabel(tenantHours.closeTime)}
                </p>
              </>
            )}
            {state?.errors?.openTime && <p className="text-xs text-red-600">{state.errors.openTime[0]}</p>}
          </div>

          {/* Services */}
          {allServices.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="border-t border-zinc-100 pt-1" />
              <p className="text-sm font-medium text-zinc-700">Servicios disponibles en esta sucursal</p>
              <div className="flex flex-col gap-1.5">
                {allServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
                    <input
                      type="checkbox"
                      name="serviceId"
                      value={s.id}
                      defaultChecked={branch?.serviceIds.includes(s.id) ?? false}
                      className="w-4 h-4 rounded accent-zinc-900"
                    />
                    <span className="text-sm text-zinc-700">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
          >
            {pending ? 'Guardando…' : branch ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SucursalesClient({
  branches,
  tenantHours,
  allServices,
}: {
  branches: Branch[]
  tenantHours: TenantHours
  allServices: ServiceItem[]
}) {
  const [modal, setModal] = useState<'create' | Branch | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBranch(id)
      setConfirmId(null)
    })
  }

  function hoursLabel(b: Branch) {
    if (b.openTime !== null && b.closeTime !== null) {
      return `${pad2(b.openTime)}:00 – ${pad2(b.closeTime)}:00`
    }
    return `${pad2(tenantHours.openTime)}:00 – ${pad2(tenantHours.closeTime)}:00 (heredado)`
  }

  function initials(email: string) {
    return email[0].toUpperCase()
  }

  return (
    <>
      <PageHeader
        title="Sucursales"
        description="Ubicaciones y locales del negocio"
        action={
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-700 cursor-pointer transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        }
      />

      {branches.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400 mb-3">Todavía no hay sucursales.</p>
          <button
            onClick={() => setModal('create')}
            className="text-sm font-medium text-zinc-900 underline underline-offset-2 cursor-pointer"
          >
            Agregar la primera
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {branches.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                  {b.address && (
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {b.address}
                    </p>
                  )}
                  {b.phone && (
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                      </svg>
                      {b.phone}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {hoursLabel(b)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {confirmId === b.id ? (
                    <DeleteConfirm
                      onConfirm={() => handleDelete(b.id)}
                      onCancel={() => setConfirmId(null)}
                      disabled={isPending}
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => setModal(b)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                        aria-label="Editar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmId(b.id)}
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

              {/* Professionals assigned to this branch */}
              {b.professionals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400">Profesionales:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {b.professionals.map((pro) => (
                      <span
                        key={pro.id}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700"
                        title={pro.email}
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-800 flex-shrink-0">
                          {initials(pro.email)}
                        </span>
                        <span className="max-w-[120px] truncate">{pro.email.split('@')[0]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <BranchModal
          key={modal === 'create' ? 'create' : modal.id}
          branch={modal === 'create' ? undefined : modal}
          tenantHours={tenantHours}
          allServices={allServices}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
