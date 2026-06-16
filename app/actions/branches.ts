'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'

type BranchState = { errors?: Record<string, string[]>; success?: boolean } | undefined

function parseHour(val: FormDataEntryValue | null): number | null {
  if (!val || val === '') return null
  const n = parseInt(val as string, 10)
  return isNaN(n) ? null : n
}

function parseWorkingDays(val: FormDataEntryValue | null): number | null {
  if (!val || val === '') return null
  const n = parseInt(val as string, 10)
  return isNaN(n) ? null : n
}

function validate(name: string, openTime: number | null, closeTime: number | null) {
  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es requerido.']
  if (openTime !== null && closeTime !== null && openTime >= closeTime) {
    errors.openTime = ['El horario de cierre debe ser posterior al de apertura.']
  }
  return errors
}

export async function createBranch(state: BranchState, formData: FormData): Promise<BranchState> {
  const { tenantId } = await requireTenantId()

  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const openTime = parseHour(formData.get('openTime'))
  const closeTime = parseHour(formData.get('closeTime'))
  const workingDays = parseWorkingDays(formData.get('workingDays'))
  const serviceIds = formData.getAll('serviceId') as string[]

  const errors = validate(name, openTime, closeTime)
  if (Object.keys(errors).length) return { errors }

  await prisma.branch.create({
    data: {
      name, address, phone, openTime, closeTime, workingDays, tenantId,
      services: serviceIds.length ? { connect: serviceIds.map((id) => ({ id })) } : undefined,
    },
  })

  revalidatePath('/dashboard/sucursales')
  return { success: true }
}

export async function updateBranch(state: BranchState, formData: FormData): Promise<BranchState> {
  const { tenantId } = await requireTenantId()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const address = (formData.get('address') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const openTime = parseHour(formData.get('openTime'))
  const closeTime = parseHour(formData.get('closeTime'))
  const workingDays = parseWorkingDays(formData.get('workingDays'))
  const serviceIds = formData.getAll('serviceId') as string[]

  const errors = validate(name, openTime, closeTime)
  if (Object.keys(errors).length) return { errors }

  const existing = await prisma.branch.findFirst({ where: { id, tenantId } })
  if (!existing) return { errors: { name: ['Sucursal no encontrada.'] } }

  await prisma.branch.update({
    where: { id },
    data: {
      name, address, phone, openTime, closeTime, workingDays,
      services: { set: serviceIds.map((sid) => ({ id: sid })) },
    },
  })

  revalidatePath('/dashboard/sucursales')
  return { success: true }
}

export async function deleteBranch(id: string): Promise<void> {
  const { tenantId } = await requireTenantId()
  await prisma.branch.deleteMany({ where: { id, tenantId } })
  revalidatePath('/dashboard/sucursales')
}
