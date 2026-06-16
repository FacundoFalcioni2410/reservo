import 'server-only'
import { Resend } from 'resend'

type EmailTemplate = { subject: string; body: string } | null | undefined

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{{${key}}}`, val),
    template
  )
}

function bodyToHtml(text: string): string {
  const lines = text.split('\n').map((line) =>
    line.trim() === ''
      ? '<br>'
      : `<p style="margin:0 0 12px">${line}</p>`
  )
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b;font-size:14px;line-height:1.6">${lines.join('')}</div>`
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return { resend: new Resend(apiKey), from: process.env.RESEND_FROM ?? 'onboarding@resend.dev' }
}

// ── Default templates ─────────────────────────────────────────────────────────

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

// ── Public functions ──────────────────────────────────────────────────────────

export async function sendInviteEmail({
  to,
  inviteUrl,
  tenantName,
  template,
}: {
  to: string
  inviteUrl: string
  tenantName: string
  template?: EmailTemplate
}) {
  const vars = { tenantName, inviteUrl }
  const subject = renderTemplate(template?.subject ?? DEFAULT_INVITE_SUBJECT, vars)
  const html = bodyToHtml(renderTemplate(template?.body ?? DEFAULT_INVITE_BODY, vars))

  const client = getResend()
  if (!client) {
    console.log('\n--- INVITE EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Invite URL: ${inviteUrl}`)
    console.log('-----------------------------------------------\n')
    return
  }

  const { data, error } = await client.resend.emails.send({ from: client.from, to, subject, html })
  if (error) {
    console.error('[Resend error]', error)
    throw new Error(error.message)
  }
  console.log('[Resend] email sent:', data?.id)
}

export async function sendBookingConfirmationEmail({
  to,
  clientName,
  serviceName,
  professionalName,
  startTime,
  tenantName,
  template,
}: {
  to: string
  clientName: string
  serviceName: string
  professionalName: string
  startTime: Date
  tenantName: string
  template?: EmailTemplate
}) {
  const formattedTime = startTime.toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  const vars = { clientName, serviceName, professionalName, startTime: formattedTime, tenantName }
  const subject = renderTemplate(template?.subject ?? DEFAULT_BOOKING_SUBJECT, vars)
  const html = bodyToHtml(renderTemplate(template?.body ?? DEFAULT_BOOKING_BODY, vars))

  const client = getResend()
  if (!client) {
    console.log('\n--- BOOKING CONFIRMATION EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('------------------------------------------------------------\n')
    return
  }

  const { data, error } = await client.resend.emails.send({ from: client.from, to, subject, html })
  if (error) {
    console.error('[Resend error]', error)
    throw new Error(error.message)
  }
  console.log('[Resend] email sent:', data?.id)
}
