'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'

type ServiceState = { errors?: Record<string, string[]>; success?: boolean } | undefined

function parsePrice(val: FormDataEntryValue | null): number | null {
  if (!val || val === '') return null
  const n = parseFloat((val as string).replace(',', '.'))
  return isNaN(n) || n < 0 ? null : n
}

export async function createService(state: ServiceState, formData: FormData): Promise<ServiceState> {
  const { tenantId } = await requireTenantId()

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const imageUrl = (formData.get('imageUrl') as string)?.trim() || null
  const price = parsePrice(formData.get('price'))
  const duration = parseInt(formData.get('duration') as string, 10) || 60

  if (!name) return { errors: { name: ['El nombre es obligatorio.'] } }

  await prisma.service.create({
    data: { name, description, imageUrl, price, duration, tenantId },
  })

  revalidatePath('/dashboard/servicios')
  revalidatePath('/dashboard/sucursales')
  revalidatePath('/dashboard/profesionales')
  return { success: true }
}

export async function updateService(state: ServiceState, formData: FormData): Promise<ServiceState> {
  const { tenantId } = await requireTenantId()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const imageUrl = (formData.get('imageUrl') as string)?.trim() || null
  const price = parsePrice(formData.get('price'))
  const duration = parseInt(formData.get('duration') as string, 10) || 60

  if (!name) return { errors: { name: ['El nombre es obligatorio.'] } }

  await prisma.service.updateMany({
    where: { id, tenantId },
    data: { name, description, imageUrl, price, duration },
  })

  revalidatePath('/dashboard/servicios')
  return { success: true }
}

export async function deleteService(id: string): Promise<void> {
  const { tenantId } = await requireTenantId()
  await prisma.service.deleteMany({ where: { id, tenantId } })
  revalidatePath('/dashboard/servicios')
  revalidatePath('/dashboard/sucursales')
  revalidatePath('/dashboard/profesionales')
}
