'use server'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/app/lib/email'

type ProfState =
  | { errors?: Record<string, string[]>; success?: boolean; inviteUrl?: string }
  | undefined

export async function createProfessional(state: ProfState, formData: FormData): Promise<ProfState> {
  const { tenantId } = await requireTenantId()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const sendInvite = formData.get('sendInvite') === 'true'
  const password = formData.get('password') as string

  const errors: Record<string, string[]> = {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Email inválido.']
  if (!sendInvite && (!password || password.length < 8)) errors.password = ['Mínimo 8 caracteres.']
  if (Object.keys(errors).length) return { errors }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { errors: { email: ['Ya existe un usuario con ese email.'] } }

  if (sendInvite) {
    const [tenant, template] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
      prisma.emailTemplate.findUnique({
        where: { tenantId_type: { tenantId, type: 'invite' } },
        select: { subject: true, body: true },
      }),
    ])

    const inviteToken = randomBytes(32).toString('hex')
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await prisma.user.create({
      data: { email, passwordHash: null, inviteToken, inviteExpiry, role: 'professional', tenantId },
    })

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite?token=${inviteToken}`

    // Try to send email — if it fails we still return the link so the admin can share it manually
    try {
      await sendInviteEmail({ to: email, inviteUrl, tenantName: tenant?.name ?? 'Reservo', template })
    } catch (err) {
      console.warn('[email] Could not send invite email, returning link for manual sharing:', err)
    }

    revalidatePath('/dashboard/professionals')
    return { success: true, inviteUrl }
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { email, passwordHash, role: 'professional', tenantId },
    })
  }

  revalidatePath('/dashboard/professionals')
  return { success: true }
}

export async function deleteProfessional(id: string): Promise<void> {
  const { tenantId } = await requireTenantId()
  await prisma.user.deleteMany({ where: { id, tenantId, role: 'professional' } })
  revalidatePath('/dashboard/professionals')
}
