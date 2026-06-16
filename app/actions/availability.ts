'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'

export type ScheduleDay = {
  dayOfWeek: number
  isWorkingDay: boolean
  startHour: number
  endHour: number
}

export type BlackoutItem = {
  id: string
  startDate: string
  endDate: string
  reason: string | null
}

export async function getSchedule(professionalId: string): Promise<ScheduleDay[]> {
  const { tenantId } = await requireTenantId()
  const pro = await prisma.user.findFirst({
    where: { id: professionalId, tenantId, role: 'professional' },
    select: { id: true },
  })
  if (!pro) return []
  return prisma.professionalSchedule.findMany({
    where: { professionalId },
    select: { dayOfWeek: true, isWorkingDay: true, startHour: true, endHour: true },
    orderBy: { dayOfWeek: 'asc' },
  })
}

export async function saveSchedule(
  _state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const { tenantId } = await requireTenantId()
  const professionalId = formData.get('professionalId') as string
  if (!professionalId) return { error: 'Profesional requerido.' }

  const pro = await prisma.user.findFirst({
    where: { id: professionalId, tenantId, role: 'professional' },
    select: { id: true },
  })
  if (!pro) return { error: 'Profesional no encontrado.' }

  const ops = Array.from({ length: 7 }, (_, day) => {
    const isWorkingDay = formData.get(`working_${day}`) === 'true'
    const startHour = parseInt(formData.get(`start_${day}`) as string) || 8
    const endHour = parseInt(formData.get(`end_${day}`) as string) || 20
    return prisma.professionalSchedule.upsert({
      where: { professionalId_dayOfWeek: { professionalId, dayOfWeek: day } },
      update: { isWorkingDay, startHour, endHour },
      create: { professionalId, dayOfWeek: day, isWorkingDay, startHour, endHour },
    })
  })

  await prisma.$transaction(ops)
  revalidatePath('/dashboard/profesionales')
  return { success: true }
}

export async function getBlackouts(professionalId: string): Promise<BlackoutItem[]> {
  const { tenantId } = await requireTenantId()
  const rows = await prisma.blackoutDate.findMany({
    where: { tenantId, professionalId },
    select: { id: true, startDate: true, endDate: true, reason: true },
    orderBy: { startDate: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    reason: r.reason,
  }))
}

export async function createBlackout(
  _state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const { tenantId } = await requireTenantId()
  const professionalId = formData.get('professionalId') as string
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const reason = (formData.get('reason') as string)?.trim() || null

  if (!professionalId || !startDateStr || !endDateStr) {
    return { error: 'Completá los campos requeridos.' }
  }

  const startDate = new Date(startDateStr + 'T00:00:00Z')
  const endDate = new Date(endDateStr + 'T00:00:00Z')

  if (endDate < startDate) return { error: 'La fecha de fin debe ser igual o posterior al inicio.' }

  await prisma.blackoutDate.create({
    data: { tenantId, professionalId, startDate, endDate, reason },
  })

  revalidatePath('/dashboard/profesionales')
  return { success: true }
}

export async function deleteBlackout(id: string): Promise<void> {
  const { tenantId } = await requireTenantId()
  await prisma.blackoutDate.deleteMany({ where: { id, tenantId } })
  revalidatePath('/dashboard/profesionales')
}

export async function getTenantBlackouts(): Promise<BlackoutItem[]> {
  const { tenantId } = await requireTenantId()
  const rows = await prisma.blackoutDate.findMany({
    where: { tenantId, professionalId: null },
    select: { id: true, startDate: true, endDate: true, reason: true },
    orderBy: { startDate: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    reason: r.reason,
  }))
}

export async function createTenantBlackout(
  _state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const { tenantId } = await requireTenantId()
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const reason = (formData.get('reason') as string)?.trim() || null

  if (!startDateStr || !endDateStr) return { error: 'Completá los campos requeridos.' }

  const startDate = new Date(startDateStr + 'T00:00:00Z')
  const endDate = new Date(endDateStr + 'T00:00:00Z')

  if (endDate < startDate) return { error: 'La fecha de fin debe ser igual o posterior al inicio.' }

  await prisma.blackoutDate.create({ data: { tenantId, professionalId: null, startDate, endDate, reason } })

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}
