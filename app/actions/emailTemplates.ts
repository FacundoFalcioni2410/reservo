'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import type { EmailTemplateType } from '@prisma/client'

type TemplateState =
  | { errors?: Record<string, string[]>; success?: boolean; message?: string }
  | undefined

export async function upsertEmailTemplate(
  state: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const { tenantId } = await requireTenantId()

  const type = formData.get('type') as EmailTemplateType
  const subject = (formData.get('subject') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()

  const validTypes: EmailTemplateType[] = ['invite', 'booking_confirmation']
  if (!validTypes.includes(type)) return { errors: { type: ['Tipo inválido.'] } }

  const errors: Record<string, string[]> = {}
  if (!subject) errors.subject = ['El asunto es requerido.']
  if (!body) errors.body = ['El cuerpo es requerido.']
  if (Object.keys(errors).length > 0) return { errors }

  await prisma.emailTemplate.upsert({
    where: { tenantId_type: { tenantId, type } },
    create: { tenantId, type, subject, body },
    update: { subject, body },
  })

  revalidatePath('/dashboard/configuracion')
  return { success: true, message: 'Template guardado.' }
}
