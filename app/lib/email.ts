import 'server-only'
import { Resend } from 'resend'
import { generateICS } from './ics'

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

// ── Event emails ──────────────────────────────────────────────────────────────

function formatEventDateTime(date: Date): string {
  return date.toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export async function sendEventConfirmationEmail({
  to,
  clientName,
  eventTitle,
  location,
  description,
  tenantName,
  occurrenceId,
  start,
  end,
  cancellationUrl,
}: {
  to: string
  clientName: string
  eventTitle: string
  location?: string | null
  description?: string | null
  tenantName: string
  occurrenceId: string
  start: Date
  end: Date
  cancellationUrl: string
}) {
  const formattedTime = formatEventDateTime(start)
  const locationLine = location ? `\nLugar: ${location}` : ''
  const subject = `Tu inscripción a "${eventTitle}" — ${tenantName}`
  const body = `Hola ${clientName},

Tu inscripción fue confirmada.

Evento: ${eventTitle}
Fecha y hora: ${formattedTime}${locationLine}

Adjuntamos un archivo .ics para que puedas agregar el evento a tu calendario.

Si no podés asistir, cancelá tu lugar desde este link:
${cancellationUrl}

${tenantName}`

  const icsContent = generateICS({
    uid: occurrenceId,
    title: `${eventTitle} — ${tenantName}`,
    description: description ?? undefined,
    location: location ?? undefined,
    start,
    end,
  })

  const client = getResend()
  if (!client) {
    console.log('\n--- EVENT CONFIRMATION EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to} | Subject: ${subject}`)
    console.log(`Cancellation URL: ${cancellationUrl}`)
    console.log('-----------------------------------------------------------\n')
    return
  }

  const { data: d1, error: e1 } = await client.resend.emails.send({
    from: client.from,
    to,
    subject,
    html: bodyToHtml(body),
    attachments: [{ filename: 'evento.ics', content: Buffer.from(icsContent).toString('base64') }],
  })
  if (e1) { console.error('[Resend error]', e1); throw new Error(e1.message) }
  console.log('[Resend] event confirmation sent:', d1?.id)
}

export async function sendEventCancellationEmail({
  to,
  clientName,
  eventTitle,
  start,
  tenantName,
}: {
  to: string
  clientName: string
  eventTitle: string
  start: Date
  tenantName: string
}) {
  const formattedTime = formatEventDateTime(start)
  const subject = `Cancelación del evento "${eventTitle}" — ${tenantName}`
  const body = `Hola ${clientName},

Lamentamos informarte que el evento al que estabas inscripto fue cancelado.

Evento: ${eventTitle}
Fecha y hora: ${formattedTime}

Disculpá las molestias.

${tenantName}`

  const client = getResend()
  if (!client) {
    console.log('\n--- EVENT CANCELLATION EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to} | Subject: ${subject}`)
    console.log('----------------------------------------------------------\n')
    return
  }

  const { data: d2, error: e2 } = await client.resend.emails.send({ from: client.from, to, subject, html: bodyToHtml(body) })
  if (e2) { console.error('[Resend error]', e2); throw new Error(e2.message) }
  console.log('[Resend] event cancellation sent:', d2?.id)
}

export async function sendEventRegistrationPendingEmail({
  to,
  clientName,
  eventTitle,
  location,
  tenantName,
  start,
  confirmationUrl,
  cancellationUrl,
}: {
  to: string
  clientName: string
  eventTitle: string
  location?: string | null
  tenantName: string
  start: Date
  confirmationUrl: string
  cancellationUrl: string
}) {
  const formattedTime = formatEventDateTime(start)
  const locationLine = location ? `\nLugar: ${location}` : ''
  const subject = `Confirmá tu inscripción a "${eventTitle}" — ${tenantName}`
  const body = `Hola ${clientName},

Recibimos tu solicitud de inscripción. Para confirmar tu lugar, hacé clic en el siguiente link:

${confirmationUrl}

Este link expira en 1 hora. Si no confirmás a tiempo, tu lugar se liberará automáticamente.

Evento: ${eventTitle}
Fecha y hora: ${formattedTime}${locationLine}

Si no querés asistir, cancelá tu inscripción:
${cancellationUrl}

${tenantName}`

  const client = getResend()
  if (!client) {
    console.log('\n--- EVENT REGISTRATION PENDING EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to} | Subject: ${subject}`)
    console.log(`Confirmation URL: ${confirmationUrl}`)
    console.log('-------------------------------------------------------------------\n')
    return
  }

  const { data: d4, error: e4 } = await client.resend.emails.send({ from: client.from, to, subject, html: bodyToHtml(body) })
  if (e4) { console.error('[Resend error]', e4); throw new Error(e4.message) }
  console.log('[Resend] registration pending sent:', d4?.id)
}

export async function sendWaitlistPromotionEmail({
  to,
  clientName,
  eventTitle,
  location,
  description,
  tenantName,
  occurrenceId,
  start,
  end,
  cancellationUrl,
  confirmationUrl,
}: {
  to: string
  clientName: string
  eventTitle: string
  location?: string | null
  description?: string | null
  tenantName: string
  occurrenceId: string
  start: Date
  end: Date
  cancellationUrl: string
  confirmationUrl: string
}) {
  const formattedTime = formatEventDateTime(start)
  const locationLine = location ? `\nLugar: ${location}` : ''
  const subject = `¡Se liberó un lugar en "${eventTitle}"! Confirmá tu inscripción — ${tenantName}`
  const body = `Hola ${clientName},

Se liberó un lugar y pasaste de la lista de espera. Para confirmar tu inscripción, hacé clic en el siguiente link antes de que expire (1 hora):

${confirmationUrl}

Evento: ${eventTitle}
Fecha y hora: ${formattedTime}${locationLine}

Si no podés asistir, cancelá desde aquí:
${cancellationUrl}

${tenantName}`

  const client = getResend()
  if (!client) {
    console.log('\n--- WAITLIST PROMOTION EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to} | Subject: ${subject}`)
    console.log(`Confirmation URL: ${confirmationUrl}`)
    console.log('----------------------------------------------------------\n')
    return
  }

  const { data: d3, error: e3 } = await client.resend.emails.send({ from: client.from, to, subject, html: bodyToHtml(body) })
  if (e3) { console.error('[Resend error]', e3); throw new Error(e3.message) }
  console.log('[Resend] waitlist promotion sent:', d3?.id)
}
