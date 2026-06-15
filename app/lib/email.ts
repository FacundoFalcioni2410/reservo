import 'server-only'
import { Resend } from 'resend'

type InviteEmailOptions = {
  to: string
  inviteUrl: string
  tenantName: string
}

export async function sendInviteEmail({ to, inviteUrl, tenantName }: InviteEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('\n--- INVITE EMAIL (dev — no RESEND_API_KEY) ---')
    console.log(`To: ${to}`)
    console.log(`Invite URL: ${inviteUrl}`)
    console.log('-----------------------------------------------\n')
    return
  }

  // Without a verified domain in Resend, the from must be onboarding@resend.dev
  // and the recipient must be the Resend account owner email.
  // Set RESEND_FROM to your verified domain once you add one in the Resend dashboard.
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Invitación para unirte a ${tenantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 8px">
          Te invitaron a unirte a ${tenantName}
        </h2>
        <p style="font-size:14px;color:#52525b;margin:0 0 24px">
          Hacé clic en el botón para configurar tu contraseña y acceder a tu cuenta profesional.
        </p>
        <a href="${inviteUrl}"
          style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
          Configurar contraseña
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0">
          El link expira en 48 horas. Si no esperabas esta invitación, ignorá este mensaje.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Resend error]', error)
    throw new Error(error.message)
  }

  console.log('[Resend] email sent:', data?.id)
}
