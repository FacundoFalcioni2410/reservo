'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'

type SettingsState =
  | { errors?: Record<string, string[]>; success?: boolean; message?: string }
  | undefined

export async function updateTenantSettings(
  state: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { tenantId } = await requireTenantId()

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const openTime = parseInt(formData.get('openTime') as string, 10)
  const closeTime = parseInt(formData.get('closeTime') as string, 10)
  const workingDays = parseInt(formData.get('workingDays') as string, 10)

  const errors: Record<string, string[]> = {}

  if (!name) errors.name = ['El nombre es requerido.']
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.slug = ['Solo letras minúsculas, números y guiones.']
  if (isNaN(openTime) || isNaN(closeTime) || openTime >= closeTime) {
    errors.openTime = ['El horario de cierre debe ser posterior al de apertura.']
  }

  if (Object.keys(errors).length > 0) return { errors }

  const conflict = await prisma.tenant.findFirst({
    where: { slug, NOT: { id: tenantId } },
    select: { id: true },
  })
  if (conflict) return { errors: { slug: ['Este slug ya está en uso.'] } }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name, slug, phone, description, openTime, closeTime, workingDays: isNaN(workingDays) ? 62 : workingDays },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/configuracion')
  return { success: true, message: 'Cambios guardados.' }
}
