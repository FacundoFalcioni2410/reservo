'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent, deleteCalendarEvent } from '@/app/lib/googleCalendar'

type BookingState = { error?: string; success?: boolean } | undefined

export async function createBooking(state: BookingState, formData: FormData): Promise<BookingState> {
  const { tenantId } = await requireTenantId()

  const clientName = (formData.get('clientName') as string)?.trim()
  const clientPhone = (formData.get('clientPhone') as string)?.trim() || null
  const serviceId = (formData.get('serviceId') as string) || null
  const professionalId = (formData.get('professionalId') as string) || null
  const notes = (formData.get('notes') as string)?.trim() || null
  const date = formData.get('date') as string
  const startTimeStr = formData.get('startTime') as string
  const endTimeStr = formData.get('endTime') as string

  if (!clientName || !date || !startTimeStr || !endTimeStr) {
    return { error: 'Completá los campos requeridos.' }
  }

  const startTime = new Date(`${date}T${startTimeStr}:00Z`)
  const endTime = new Date(`${date}T${endTimeStr}:00Z`)

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { error: 'Fecha u hora inválida.' }
  }
  if (endTime <= startTime) {
    return { error: 'La hora de fin debe ser posterior al inicio.' }
  }

  let serviceName: string | null = null
  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } })
    serviceName = service?.name ?? null
  }

  const booking = await prisma.booking.create({
    data: {
      tenantId,
      clientName,
      clientPhone,
      serviceId,
      serviceName,
      professionalId,
      startTime,
      endTime,
      notes,
    },
  })

  try {
    const summary = serviceName ? `${serviceName} — ${clientName}` : clientName
    const description = [clientPhone && `Tel: ${clientPhone}`, notes].filter(Boolean).join('\n') || null
    const calendarEvent = { summary, description, startTime, endTime }

    // Try professional's calendar first, fall back to any tenant admin with Google connected
    let eventId = professionalId ? await createCalendarEvent(professionalId, calendarEvent) : null
    if (!eventId) {
      const adminWithCalendar = await prisma.user.findFirst({
        where: { tenantId, role: 'admin', googleRefreshToken: { not: null } },
        select: { id: true },
      })
      if (adminWithCalendar) eventId = await createCalendarEvent(adminWithCalendar.id, calendarEvent)
    }
    if (eventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { googleCalendarEventId: eventId } })
    }
  } catch (err) {
    console.error('[google-calendar] createCalendarEvent failed:', err)
  }

  revalidatePath('/dashboard/bookings')
  return { success: true }
}

export async function updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed') {
  const { tenantId } = await requireTenantId()

  const booking = await prisma.booking.findFirst({ where: { id, tenantId } })
  if (!booking) return

  await prisma.booking.update({ where: { id }, data: { status } })

  if (status === 'cancelled' && booking.professionalId && booking.googleCalendarEventId) {
    try {
      await deleteCalendarEvent(booking.professionalId, booking.googleCalendarEventId)
      await prisma.booking.update({ where: { id }, data: { googleCalendarEventId: null } })
    } catch {
      // Calendar sync failure is non-fatal
    }
  }

  revalidatePath('/dashboard/bookings')
}

export async function getBookingsForProfessional(professionalId: string) {
  const { tenantId } = await requireTenantId()
  const bookings = await prisma.booking.findMany({
    where: { tenantId, professionalId },
    select: { id: true, clientName: true, serviceName: true, startTime: true, endTime: true, status: true },
    orderBy: { startTime: 'asc' },
  })
  return bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status as string,
  }))
}

export async function getBookingsForClient(clientEmail: string | null, clientNameFallback: string | null) {
  const { tenantId } = await requireTenantId()
  const where = clientEmail
    ? { tenantId, clientEmail }
    : { tenantId, clientEmail: null as string | null, clientName: clientNameFallback! }
  const bookings = await prisma.booking.findMany({
    where,
    select: { id: true, serviceName: true, startTime: true, endTime: true, status: true },
    orderBy: { startTime: 'asc' },
  })
  return bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status as string,
  }))
}
