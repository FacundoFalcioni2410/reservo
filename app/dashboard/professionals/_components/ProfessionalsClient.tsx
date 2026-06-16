'use client'
import { useState, useTransition, useActionState, useEffect } from 'react'
import PageHeader from '../../_components/PageHeader'
import DeleteConfirm from '../../_components/DeleteConfirm'
import { createProfessional, deleteProfessional } from '@/app/actions/professionals'
import { updateProfessionalAssignments } from '@/app/actions/assignments'
import { getBookingsForProfessional } from '@/app/actions/bookings'

type AssignItem = { id: string; name: string }

type Professional = {
  id: string
  email: string
  createdAt: string
  pendingInvite: boolean
  branches: AssignItem[]
  services: AssignItem[]
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

// ─── Copy invite link screen ───────────────────────────────────────────────────

function InviteLinkScreen({ inviteUrl, onClose }: { inviteUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="px-5 py-6 flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-900">Profesional creado</p>
        <p className="text-xs text-zinc-500">
          {copied ? '¡Copiado!' : 'Compartí este link para que configure su contraseña.'}
        </p>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
        <p className="text-xs text-zinc-600 font-mono break-all flex-1">{inviteUrl}</p>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
          aria-label="Copiar"
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-zinc-400 text-center">El link expira en 48 horas.</p>

      <button
        onClick={onClose}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 cursor-pointer transition"
      >
        Listo
      </button>
    </div>
  )
}

// ─── Add modal ────────────────────────────────────────────────────────────────

function AddModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createProfessional, undefined)
  const [sendInvite, setSendInvite] = useState(true)
  const [showPass, setShowPass] = useState(false)

  const showInviteLink = state?.success && !!state?.inviteUrl

  useEffect(() => {
    if (state?.success && !state?.inviteUrl) onClose()
  }, [state?.success])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-semibold text-zinc-900">Nuevo profesional</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {showInviteLink ? (
          <InviteLinkScreen inviteUrl={state.inviteUrl!} onClose={onClose} />
        ) : (
          <form action={action} className="px-5 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input name="email" type="email" required autoComplete="off" placeholder="prof@negocio.com" className={INPUT_CLASS} />
              {state?.errors?.email && <p className="text-xs text-red-600">{state.errors.email[0]}</p>}
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setSendInvite(true)}
                className={`flex-1 py-2 font-medium transition cursor-pointer ${sendInvite ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Enviar invitación
              </button>
              <button
                type="button"
                onClick={() => setSendInvite(false)}
                className={`flex-1 py-2 font-medium transition cursor-pointer ${!sendInvite ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                Establecer contraseña
              </button>
            </div>
            <input type="hidden" name="sendInvite" value={sendInvite ? 'true' : 'false'} />

            {sendInvite ? (
              <p className="text-xs text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2.5 border border-zinc-200">
                Se generará un link de invitación. Si el email no llega, podés compartirlo manualmente.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required={!sendInvite}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className={`${INPUT_CLASS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 cursor-pointer transition"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {state?.errors?.password && <p className="text-xs text-red-600">{state.errors.password[0]}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
            >
              {pending ? 'Guardando…' : sendInvite ? 'Enviar invitación' : 'Crear profesional'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({
  professional,
  allBranches,
  allServices,
  onClose,
}: {
  professional: Professional
  allBranches: AssignItem[]
  allServices: AssignItem[]
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(updateProfessionalAssignments, undefined)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">Asignaciones</h2>
            <p className="text-xs text-zinc-400 truncate">{professional.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={action} className="px-5 py-5 flex flex-col gap-5">
          <input type="hidden" name="professionalId" value={professional.id} />
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

          {/* Branches */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-zinc-900">Sucursales</p>
            {allBranches.length === 0 ? (
              <p className="text-xs text-zinc-400">No hay sucursales creadas.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {allBranches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      name="branchId"
                      value={b.id}
                      defaultChecked={professional.branches.some((pb) => pb.id === b.id)}
                      className="w-4 h-4 rounded accent-zinc-900"
                    />
                    <span className="text-sm text-zinc-700">{b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100" />

          {/* Services */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-zinc-900">Servicios que realiza</p>
            {allServices.length === 0 ? (
              <p className="text-xs text-zinc-400">No hay servicios creados.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {allServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      name="serviceId"
                      value={s.id}
                      defaultChecked={professional.services.some((ps) => ps.id === s.id)}
                      className="w-4 h-4 rounded accent-zinc-900"
                    />
                    <span className="text-sm text-zinc-700">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
          >
            {pending ? 'Guardando…' : 'Guardar asignaciones'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Bookings modal ───────────────────────────────────────────────────────────

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-600' },
}

type BookingItem = { id: string; clientName: string; serviceName: string | null; startTime: string; endTime: string; status: string }

function BookingRow({ b }: { b: BookingItem }) {
  const s = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-zinc-100 text-zinc-600' }
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 truncate">{b.clientName}</p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {b.serviceName && <span>{b.serviceName} · </span>}
          {formatDateTime(b.startTime)}
        </p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
    </div>
  )
}

function BookingsModal({ professionalId, professionalEmail, onClose }: { professionalId: string; professionalEmail: string; onClose: () => void }) {
  const [bookings, setBookings] = useState<BookingItem[] | null>(null)

  useEffect(() => {
    getBookingsForProfessional(professionalId).then(setBookings)
  }, [professionalId])

  const now = new Date().toISOString()
  const upcoming = bookings?.filter((b) => b.startTime >= now) ?? []
  const past = bookings?.filter((b) => b.startTime < now).reverse() ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">Turnos</h2>
            <p className="text-xs text-zinc-400 truncate">{professionalEmail}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {bookings === null ? (
            <p className="text-sm text-zinc-400 text-center py-10">Cargando…</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">Este profesional no tiene turnos.</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 border-b border-zinc-100">
                    Próximos ({upcoming.length})
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {upcoming.map((b) => <BookingRow key={b.id} b={b} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 border-b border-zinc-100">
                    Pasados ({past.length})
                  </p>
                  <div className="divide-y divide-zinc-100">
                    {past.map((b) => <BookingRow key={b.id} b={b} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfessionalsClient({
  professionals,
  allBranches,
  allServices,
}: {
  professionals: Professional[]
  allBranches: AssignItem[]
  allServices: AssignItem[]
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [assignPro, setAssignPro] = useState<Professional | null>(null)
  const [bookingsPro, setBookingsPro] = useState<Professional | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteProfessional(id)
      setConfirmId(null)
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function initials(email: string) {
    return email[0].toUpperCase()
  }

  return (
    <>
      <PageHeader
        title="Profesionales"
        description="Equipo de trabajo del negocio"
        action={
          <button
            onClick={() => setShowAdd(true)}
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

      {professionals.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400 mb-3">Todavía no hay profesionales.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium text-zinc-900 underline underline-offset-2 cursor-pointer"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {professionals.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600 flex-shrink-0">
                  {initials(p.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.email}</p>
                    {p.pendingInvite && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex-shrink-0">
                        Invitación pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Desde {formatDate(p.createdAt)}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {confirmId === p.id ? (
                    <DeleteConfirm
                      onConfirm={() => handleDelete(p.id)}
                      onCancel={() => setConfirmId(null)}
                      disabled={isPending}
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => setBookingsPro(p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                        aria-label="Ver turnos"
                        title="Ver turnos"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                          <path d="m9 16 2 2 4-4"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setAssignPro(p)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                        aria-label="Asignaciones"
                        title="Asignaciones"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmId(p.id)}
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

              {/* Assignment tags */}
              {(p.branches.length > 0 || p.services.length > 0) && (
                <div className="mt-2.5 pl-12 flex flex-wrap gap-1.5">
                  {p.branches.map((b) => (
                    <span key={b.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                      {b.name}
                    </span>
                  ))}
                  {p.services.map((s) => (
                    <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      {assignPro && (
        <AssignModal
          key={assignPro.id}
          professional={assignPro}
          allBranches={allBranches}
          allServices={allServices}
          onClose={() => setAssignPro(null)}
        />
      )}
      {bookingsPro && (
        <BookingsModal
          key={bookingsPro.id}
          professionalId={bookingsPro.id}
          professionalEmail={bookingsPro.email}
          onClose={() => setBookingsPro(null)}
        />
      )}
    </>
  )
}
