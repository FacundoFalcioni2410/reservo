'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/app/lib/session'

type InviteState = { error?: string } | undefined

export async function setPasswordFromInvite(state: InviteState, formData: FormData): Promise<InviteState> {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!token) return { error: 'Token inválido.' }
  if (!password || password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { id: true, role: true, tenantId: true, inviteExpiry: true },
  })

  if (!user) return { error: 'El link de invitación es inválido o ya fue usado.' }
  if (!user.inviteExpiry || user.inviteExpiry < new Date()) {
    return { error: 'El link de invitación expiró. Pedile al admin que te envíe uno nuevo.' }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, inviteToken: null, inviteExpiry: null },
  })

  await createSession(user.id, user.role, user.tenantId ?? undefined)
  redirect('/dashboard')
}
