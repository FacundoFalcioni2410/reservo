'use client'
import { useActionState, useRef } from 'react'
import { upsertEmailTemplate } from '@/app/actions/emailTemplates'
import type { EmailTemplateType } from '@prisma/client'

type Template = { subject: string; body: string } | null
type Variable = { name: string; label: string }

type Props = {
  inviteTemplate: Template
  bookingTemplate: Template
}

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

const DEFAULT_INVITE_SUBJECT = 'Invitación para unirte a {{tenantName}}'
const DEFAULT_INVITE_BODY = `Te invitaron a unirte a {{tenantName}}.

Hacé clic en el siguiente link para configurar tu contraseña y acceder a tu cuenta profesional:

{{inviteUrl}}

El link expira en 48 horas. Si no esperabas esta invitación, ignorá este mensaje.`

const DEFAULT_BOOKING_SUBJECT = 'Tu reserva en {{tenantName}}'
const DEFAULT_BOOKING_BODY = `Hola {{clientName}},

Tu reserva fue confirmada.

Servicio: {{serviceName}}
Profesional: {{professionalName}}
Fecha y hora: {{startTime}}

Gracias por elegirnos.

{{tenantName}}`

const INVITE_VARIABLES: Variable[] = [
  { name: 'tenantName', label: 'Nombre del negocio' },
  { name: 'inviteUrl', label: 'Link de invitación' },
]

const BOOKING_VARIABLES: Variable[] = [
  { name: 'clientName', label: 'Nombre del cliente' },
  { name: 'serviceName', label: 'Nombre del servicio' },
  { name: 'professionalName', label: 'Nombre del profesional' },
  { name: 'startTime', label: 'Fecha y hora' },
  { name: 'tenantName', label: 'Nombre del negocio' },
]

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msg = errors?.[field]?.[0]
  if (!msg) return null
  return <p className="text-xs text-red-600 mt-1">{msg}</p>
}

function TemplateSection({
  type,
  label,
  variables,
  defaultSubject,
  defaultBody,
  saved,
}: {
  type: EmailTemplateType
  label: string
  variables: Variable[]
  defaultSubject: string
  defaultBody: string
  saved: Template
}) {
  const [state, action, pending] = useActionState(upsertEmailTemplate, undefined)
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const lastFocused = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  function insertVariable(name: string) {
    const el = lastFocused.current ?? bodyRef.current
    if (!el) return
    const token = `{{${name}}}`
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    el.value = el.value.slice(0, start) + token + el.value.slice(end)
    el.selectionStart = el.selectionEnd = start + token.length
    el.focus()
  }

  return (
    <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-zinc-900">{label}</h2>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="type" value={type} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Asunto</label>
          <input
            ref={subjectRef}
            name="subject"
            type="text"
            defaultValue={saved?.subject ?? defaultSubject}
            onFocus={() => { lastFocused.current = subjectRef.current }}
            className={INPUT_CLASS}
          />
          <FieldError errors={state?.errors} field="subject" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Cuerpo</label>
          <textarea
            ref={bodyRef}
            name="body"
            rows={8}
            defaultValue={saved?.body ?? defaultBody}
            onFocus={() => { lastFocused.current = bodyRef.current }}
            className={`${INPUT_CLASS} resize-y font-mono text-xs`}
          />
          <FieldError errors={state?.errors} field="body" />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-zinc-500">Variables disponibles</p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => insertVariable(v.name)}
                title={`{{${v.name}}}`}
                className="rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:scale-95 px-2.5 py-1 text-xs text-zinc-700 shadow-sm transition cursor-pointer"
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400">Clic en una variable para insertarla donde esté el cursor.</p>
        </div>

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
            {pending ? 'Guardando…' : 'Guardar template'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default function EmailTemplatesForm({ inviteTemplate, bookingTemplate }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TemplateSection
        type="invite"
        label="Email de invitación a profesional"
        variables={INVITE_VARIABLES}
        defaultSubject={DEFAULT_INVITE_SUBJECT}
        defaultBody={DEFAULT_INVITE_BODY}
        saved={inviteTemplate}
      />
      <TemplateSection
        type="booking_confirmation"
        label="Email de confirmación de reserva"
        variables={BOOKING_VARIABLES}
        defaultSubject={DEFAULT_BOOKING_SUBJECT}
        defaultBody={DEFAULT_BOOKING_BODY}
        saved={bookingTemplate}
      />
    </div>
  )
}
