'use server'
import { prisma } from '@/lib/prisma'
import { requireTenantId } from '@/app/lib/dal'
import { RecurrenceType } from '@prisma/client'
import { sendEventCancellationEmail } from '@/app/lib/email'
import { computeOccurrenceDates, buildOccurrenceStart } from '@/app/lib/eventUtils'
import { deleteCalendarEvent } from '@/app/lib/googleCalendar'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

const EventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1),
  maxAttendees: z.coerce.number().int().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  recurrenceType: z.enum(['ONCE', 'WEEKLY']),
  recurrenceDays: z.coerce.number().int().min(0).max(127).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
})

export async function createEvent(formData: FormData) {
  const { tenantId } = await requireTenantId()

  const parsed = EventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const { recurrenceType, recurrenceDays, startDate, endDate, ...rest } = parsed.data

  const professionalIds = formData.getAll('professionalIds') as string[]

  await prisma.event.create({
    data: {
      ...rest,
      tenantId,
      recurrenceType: recurrenceType as RecurrenceType,
      recurrenceDays: recurrenceType === 'WEEKLY' ? (recurrenceDays ?? 0) : 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      professionals: professionalIds.length > 0
        ? { connect: professionalIds.map((id) => ({ id })) }
        : undefined,
    },
  })

  revalidatePath('/dashboard/eventos')
}

export async function updateEvent(eventId: string, formData: FormData) {
  const { tenantId } = await requireTenantId()

  const parsed = EventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const { recurrenceType, recurrenceDays, startDate, endDate, ...rest } = parsed.data
  const professionalIds = formData.getAll('professionalIds') as string[]

  // updateMany doesn't support nested M2M — need findFirst + update
  const existing = await prisma.event.findFirst({ where: { id: eventId, tenantId } })
  if (!existing) return { error: 'Evento no encontrado.' }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...rest,
      recurrenceType: recurrenceType as RecurrenceType,
      recurrenceDays: recurrenceType === 'WEEKLY' ? (recurrenceDays ?? 0) : 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      professionals: { set: professionalIds.map((id) => ({ id })) },
    },
  })

  revalidatePath('/dashboard/eventos')
  revalidatePath(`/dashboard/eventos/${eventId}`)
}

export async function toggleEventActive(eventId: string, isActive: boolean) {
  const { tenantId } = await requireTenantId()
  await prisma.event.updateMany({ where: { id: eventId, tenantId }, data: { isActive } })
  revalidatePath('/dashboard/eventos')
}

export async function deleteEvent(eventId: string) {
  const { tenantId } = await requireTenantId()
  await prisma.event.deleteMany({ where: { id: eventId, tenantId } })
  revalidatePath('/dashboard/eventos')
}

export async function cancelOccurrence(occurrenceId: string) {
  const { tenantId } = await requireTenantId()

  const occurrence = await prisma.eventOccurrence.findFirst({
    where: { id: occurrenceId, event: { tenantId } },
    include: {
      event: { include: { tenant: true } },
      attendees: { where: { status: { in: ['CONFIRMED', 'PENDING_CONFIRMATION'] } } },
      professionalEntries: true,
    },
  })
  if (!occurrence) return { error: 'Ocurrencia no encontrada.' }

  await prisma.eventOccurrence.update({
    where: { id: occurrenceId },
    data: { isCancelled: true },
  })

  const { event } = occurrence
  const dateStr = occurrence.date.toISOString().slice(0, 10)
  const start = buildOccurrenceStart(dateStr, event.time)

  // Notify confirmed/pending attendees and delete calendar events in parallel
  await Promise.allSettled([
    ...occurrence.attendees.map((a) =>
      sendEventCancellationEmail({
        to: a.clientEmail,
        clientName: a.clientName,
        eventTitle: event.title,
        start,
        tenantName: event.tenant.name,
      })
    ),
    ...occurrence.professionalEntries
      .filter((e) => e.googleCalendarEventId)
      .map((e) => deleteCalendarEvent(e.professionalId, e.googleCalendarEventId!)),
  ])

  revalidatePath(`/dashboard/eventos/${event.id}`)
}

export async function getAdminEvents() {
  const { tenantId } = await requireTenantId()
  return prisma.event.findMany({
    where: { tenantId },
    include: { professionals: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdminEventDetail(eventId: string) {
  const { tenantId } = await requireTenantId()

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      professionals: { select: { id: true, email: true } },
      occurrences: {
        orderBy: { date: 'asc' },
        include: {
          attendees: { orderBy: { registeredAt: 'asc' } },
          professionalEntries: { select: { professionalId: true, googleCalendarEventId: true } },
        },
      },
    },
  })
  if (!event) return null

  const upcomingDates = computeOccurrenceDates(event, 20)

  // Fetch all professionals of this tenant for the edit modal
  const allProfessionals = await prisma.user.findMany({
    where: { tenantId, role: 'professional', passwordHash: { not: null } },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  })

  return { event, upcomingDates, allProfessionals }
}

export async function getTenantProfessionals() {
  const { tenantId } = await requireTenantId()
  return prisma.user.findMany({
    where: { tenantId, role: 'professional', passwordHash: { not: null } },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  })
}
