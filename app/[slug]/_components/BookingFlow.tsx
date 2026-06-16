'use client'
import { useState, useEffect, useTransition } from 'react'
import { getAvailableSlots, createPublicBooking, type Slot } from '@/app/actions/publicBooking'

type Service = {
  id: string
  name: string
  description: string | null
  price: number | null
  imageUrl: string | null
  duration: number
}

type Professional = {
  id: string
  displayName: string
  serviceIds: string[]
}

type TenantInfo = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  openTime: number
  closeTime: number
}

type Step = 'service' | 'professional' | 'datetime' | 'details' | 'done'

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_SHORT = ['Do','Lu','Ma','Mi','Ju','Vi','Sa']

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string) {
  const [y, m, day] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

function pad2(n: number) { return String(n).padStart(2, '0') }

// ─── Sub-components ───────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-5 cursor-pointer transition"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Volver
    </button>
  )
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function PickerCard({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3 text-left hover:bg-zinc-50 cursor-pointer w-full"
    >
      {children}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 flex-shrink-0 ml-auto">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BookingFlow({
  tenant,
  services,
  professionals,
}: {
  tenant: TenantInfo
  services: Service[]
  professionals: Professional[]
}) {
  // Determine initial state (auto-skip steps with 0-1 options)
  const autoServiceId = services.length === 1 ? services[0].id : null
  const filteredForAuto = autoServiceId
    ? professionals.filter((p) => p.serviceIds.includes(autoServiceId))
    : professionals
  const autoProfId = filteredForAuto.length === 1 ? filteredForAuto[0].id : null

  function getInitialStep(): Step {
    if (services.length > 1) return 'service'
    if (filteredForAuto.length > 1) return 'professional'
    return 'datetime'
  }

  const [step, setStep] = useState<Step>(getInitialStep())
  const [serviceId, setServiceId] = useState<string | null>(autoServiceId)
  const [professionalId, setProfessionalId] = useState<string | null>(autoProfId)

  // Date picker
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = addDays(today, weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedMinute, setSelectedMinute] = useState<number>(0)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Details
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filtered professionals for current service selection
  const visibleProfessionals = serviceId
    ? professionals.filter((p) => p.serviceIds.includes(serviceId))
    : professionals

  // Derived display info (needed before useEffect)
  const selectedService = services.find((s) => s.id === serviceId)
  const selectedProfessional = professionals.find((p) => p.id === professionalId)

  // Duration from selected service (or default 60 min)
  const activeDuration = selectedService?.duration ?? 60

  // Load slots when date, professional, or duration changes
  useEffect(() => {
    if (!selectedDate || !professionalId) return
    setSelectedHour(null)
    setSelectedMinute(0)
    setLoadingSlots(true)
    getAvailableSlots(
      tenant.id,
      professionalId,
      selectedDate,
      tenant.openTime,
      tenant.closeTime,
      activeDuration
    ).then((result) => {
      setSlots(result)
      setLoadingSlots(false)
    })
  }, [selectedDate, professionalId, activeDuration])

  // ── Navigation helpers ──────────────────────────────────────────────────────

  function pickService(id: string) {
    setServiceId(id)
    setSelectedDate(null)
    setSelectedHour(null)
    const filtered = professionals.filter((p) => p.serviceIds.includes(id))
    if (filtered.length === 1) {
      setProfessionalId(filtered[0].id)
      setStep('datetime')
    } else if (filtered.length > 1) {
      setProfessionalId(null)
      setStep('professional')
    } else {
      // No professionals for this service — stay on service step and show nothing
      setProfessionalId(null)
      setStep('professional')
    }
  }

  function pickProfessional(id: string) {
    setProfessionalId(id)
    setSelectedDate(null)
    setSelectedHour(null)
    setStep('datetime')
  }

  function pickSlot(hour: number, minute: number) {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setStep('details')
  }

  function goBack() {
    if (step === 'details') { setStep('datetime'); return }
    if (step === 'datetime') {
      if (visibleProfessionals.length > 1) { setStep('professional'); return }
      if (services.length > 1) { setStep('service'); return }
      return
    }
    if (step === 'professional' && services.length > 1) {
      setStep('service')
    }
  }

  const canGoBack =
    step !== 'service' &&
    step !== 'done' &&
    !(step === 'datetime' && services.length <= 1 && visibleProfessionals.length <= 1)

  // ── Confirm ─────────────────────────────────────────────────────────────────

  function confirm() {
    if (!professionalId || !selectedDate || selectedHour === null || !clientName.trim()) return
    setSubmitError(null)
    startTransition(async () => {
      try {
        await createPublicBooking({
          tenantId: tenant.id,
          professionalId,
          serviceId,
          date: selectedDate,
          hour: selectedHour,
          minute: selectedMinute,
          duration: activeDuration,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim(),
        })
        setStep('done')
      } catch {
        setSubmitError('Ocurrió un error al confirmar la reserva. Intentá de nuevo.')
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {tenant.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-900 leading-tight">{tenant.name}</p>
            {tenant.description && (
              <p className="text-xs text-zinc-500 leading-tight">{tenant.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {canGoBack && <BackButton onClick={goBack} />}

        {/* ── Service ── */}
        {step === 'service' && (
          <div>
            <StepHeading title="¿Qué servicio necesitás?" subtitle="Seleccioná el servicio que querés reservar." />
            <div className="flex flex-col gap-2">
              {services.map((s) => (
                <PickerCard key={s.id} onClick={() => pickService(s.id)}>
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex-shrink-0 overflow-hidden">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                    {s.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{s.description}</p>}
                    {s.price !== null && (
                      <p className="text-xs font-semibold text-zinc-700 mt-0.5">
                        $ {s.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </PickerCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Professional ── */}
        {step === 'professional' && (
          <div>
            <StepHeading title="¿Con quién querés reservar?" subtitle="Elegí un profesional disponible." />
            {visibleProfessionals.length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-200 px-6 py-10 text-center">
                <p className="text-sm text-zinc-400">No hay profesionales disponibles para este servicio.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleProfessionals.map((p) => (
                  <PickerCard key={p.id} onClick={() => pickProfessional(p.id)}>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600 flex-shrink-0">
                      {p.displayName[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-zinc-900">{p.displayName}</p>
                  </PickerCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Date + time ── */}
        {step === 'datetime' && (
          <div>
            <StepHeading title="¿Cuándo querés reservar?" subtitle="Elegí el día y el horario." />

            {/* Week strip */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3 mb-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  onClick={() => { setWeekOffset((w) => Math.max(0, w - 1)); setSelectedDate(null) }}
                  disabled={weekOffset === 0}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-xs font-medium text-zinc-500 capitalize">
                  {weekStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => { setWeekOffset((w) => w + 1); setSelectedDate(null) }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const isPast = day < today
                  const dateStr = toDateStr(day)
                  const isSelected = dateStr === selectedDate
                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isPast && setSelectedDate(dateStr)}
                      disabled={isPast}
                      className={`flex flex-col items-center py-2 rounded-lg transition ${
                        isPast
                          ? 'text-zinc-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-zinc-900 text-white cursor-pointer'
                          : 'text-zinc-700 hover:bg-zinc-100 cursor-pointer'
                      }`}
                    >
                      <span className={`text-[10px] font-medium mb-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {DAYS_SHORT[day.getDay()]}
                      </span>
                      <span className="text-sm font-semibold">{day.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate ? (
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-700 mb-3">
                  {formatDate(selectedDate)}
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-6">No hay horarios configurados.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const endTotal = slot.hour * 60 + slot.minute + activeDuration
                      const endLabel = `${pad2(Math.floor(endTotal / 60))}:${pad2(endTotal % 60)}`
                      return (
                        <button
                          key={`${slot.hour}-${slot.minute}`}
                          onClick={() => slot.available && pickSlot(slot.hour, slot.minute)}
                          disabled={!slot.available}
                          title={!slot.available ? 'Ocupado' : `${pad2(slot.hour)}:${pad2(slot.minute)} – ${endLabel}`}
                          className={`py-2.5 px-1 rounded-lg text-sm font-medium transition ${
                            !slot.available
                              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed line-through decoration-zinc-200'
                              : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 cursor-pointer'
                          }`}
                        >
                          {pad2(slot.hour)}:{pad2(slot.minute)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 text-center py-4">Seleccioná un día para ver los horarios.</p>
            )}
          </div>
        )}

        {/* ── Details ── */}
        {step === 'details' && (
          <div>
            {/* Booking summary */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Tu turno</p>
              <div className="flex flex-col gap-1.5 text-sm">
                {selectedService && (
                  <div className="flex gap-3">
                    <span className="text-zinc-400 w-24 flex-shrink-0">Servicio</span>
                    <span className="text-zinc-900 font-medium">{selectedService.name}</span>
                  </div>
                )}
                {selectedProfessional && (
                  <div className="flex gap-3">
                    <span className="text-zinc-400 w-24 flex-shrink-0">Profesional</span>
                    <span className="text-zinc-900 font-medium">{selectedProfessional.displayName}</span>
                  </div>
                )}
                {selectedDate && selectedHour !== null && (() => {
                  const endTotal = selectedHour * 60 + selectedMinute + activeDuration
                  return (
                    <div className="flex gap-3">
                      <span className="text-zinc-400 w-24 flex-shrink-0">Fecha y hora</span>
                      <span className="text-zinc-900 font-medium">
                        {formatDate(selectedDate)} · {pad2(selectedHour)}:{pad2(selectedMinute)} – {pad2(Math.floor(endTotal / 60))}:{pad2(endTotal % 60)}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>

            <StepHeading title="Tus datos" subtitle="Completá tu información para confirmar." />

            <div className="flex flex-col gap-3">
              {[
                { label: 'Nombre', required: true, value: clientName, onChange: setClientName, type: 'text', placeholder: 'Tu nombre' },
                { label: 'Teléfono', required: false, value: clientPhone, onChange: setClientPhone, type: 'tel', placeholder: '+54 11 1234-5678' },
                { label: 'Email', required: true, value: clientEmail, onChange: setClientEmail, type: 'email', placeholder: 'tu@email.com' },
              ].map(({ label, required, value, onChange, type, placeholder }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>
              ))}

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                onClick={confirm}
                disabled={!clientName.trim() || !clientEmail.trim() || isPending}
                className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
              >
                {isPending ? 'Confirmando…' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center pt-6 pb-10">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-1">¡Reserva recibida!</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
              Tu turno está pendiente de confirmación. Te avisaremos a la brevedad.
            </p>

            <div className="bg-white rounded-xl border border-zinc-200 p-4 w-full text-left mb-6">
              <div className="flex flex-col gap-1.5 text-sm">
                {selectedService && (
                  <div className="flex gap-3">
                    <span className="text-zinc-400 w-24 flex-shrink-0">Servicio</span>
                    <span className="text-zinc-900 font-medium">{selectedService.name}</span>
                  </div>
                )}
                {selectedProfessional && (
                  <div className="flex gap-3">
                    <span className="text-zinc-400 w-24 flex-shrink-0">Profesional</span>
                    <span className="text-zinc-900 font-medium">{selectedProfessional.displayName}</span>
                  </div>
                )}
                {selectedDate && selectedHour !== null && (() => {
                  const endTotal = selectedHour * 60 + selectedMinute + activeDuration
                  return (
                    <div className="flex gap-3">
                      <span className="text-zinc-400 w-24 flex-shrink-0">Fecha y hora</span>
                      <span className="text-zinc-900 font-medium">
                        {formatDate(selectedDate)} · {pad2(selectedHour)}:{pad2(selectedMinute)} – {pad2(Math.floor(endTotal / 60))}:{pad2(endTotal % 60)}
                      </span>
                    </div>
                  )
                })()}
                <div className="flex gap-3">
                  <span className="text-zinc-400 w-24 flex-shrink-0">Nombre</span>
                  <span className="text-zinc-900 font-medium">{clientName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-2 cursor-pointer transition"
            >
              Hacer otra reserva
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
