'use client'
import { useActionState, useEffect } from 'react'
import { updateTenantSettings } from '@/app/actions/tenant'

type TenantData = {
  name: string
  slug: string
  phone: string | null
  description: string | null
  openTime: number
  closeTime: number
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
function hourLabel(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msg = errors?.[field]?.[0]
  if (!msg) return null
  return <p className="text-xs text-red-600 mt-1">{msg}</p>
}

export default function TenantSettingsForm({ tenant }: { tenant: TenantData }) {
  const [state, action, pending] = useActionState(updateTenantSettings, undefined)

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* ── Datos básicos ── */}
      <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-900">Datos del negocio</h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={tenant.name}
            placeholder="Mi negocio"
            className={INPUT_CLASS}
          />
          <FieldError errors={state?.errors} field="name" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Slug <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900">
            <span className="px-3 py-2 bg-zinc-50 text-zinc-400 text-sm border-r border-zinc-300 flex-shrink-0">
              reservo.app/
            </span>
            <input
              name="slug"
              type="text"
              required
              defaultValue={tenant.slug}
              placeholder="mi-negocio"
              className="flex-1 px-3 py-2 text-sm text-zinc-900 focus:outline-none"
            />
          </div>
          <p className="text-xs text-zinc-400">Solo letras minúsculas, números y guiones.</p>
          <FieldError errors={state?.errors} field="slug" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Teléfono</label>
          <input
            name="phone"
            type="tel"
            defaultValue={tenant.phone ?? ''}
            placeholder="+54 11 1234-5678"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Descripción</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={tenant.description ?? ''}
            placeholder="Breve descripción del negocio…"
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      </section>

      {/* ── Horarios de atención ── */}
      <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Horario de atención</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rango predeterminado para el calendario. Podés sobreescribirlo por sucursal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Apertura</label>
            <select name="openTime" defaultValue={tenant.openTime} className={INPUT_CLASS}>
              {HOURS.slice(0, 23).map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Cierre</label>
            <select name="closeTime" defaultValue={tenant.closeTime} className={INPUT_CLASS}>
              {HOURS.slice(1).map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
        </div>
        <FieldError errors={state?.errors} field="openTime" />
      </section>

      {/* ── Feedback + submit ── */}
      {state?.success && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          {state.message}
        </p>
      )}
      {state?.message && !state.success && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
