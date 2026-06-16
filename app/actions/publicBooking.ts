'use server'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmationEmail } from '@/app/lib/email'

export type Slot = { hour: number; minute: number; available: boolean }

export async function getAvailableSlots(
  tenantId: string,
  professionalId: string,
  dateStr: string,
  openTime: number,    // whole hours (e.g. 8) — used as fallback when no schedule is set
  closeTime: number,   // whole hours (e.g. 20) — used as fallback when no schedule is set
  duration: number,    // minutes (e.g. 30, 60, 90)
  workingDays: number = 127  // bitmask bit0=Dom..bit6=Sáb; 127=all open (default)
): Promise<Slot[]> {
  const [year, month, day] = dateStr.split('-').map(Number)
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const dayEnd = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay()

  const [schedule, blackout, bookings] = await Promise.all([
    prisma.professionalSchedule.findUnique({
      where: { professionalId_dayOfWeek: { professionalId, dayOfWeek } },
    }),
    prisma.blackoutDate.findFirst({
      where: {
        tenantId,
        OR: [{ professionalId }, { professionalId: null }],
        startDate: { lte: dayStart },
        endDate: { gte: dayStart },
      },
    }),
    prisma.booking.findMany({
      where: {
        tenantId,
        professionalId,
        status: { not: 'cancelled' },
        startTime: { gte: dayStart, lt: dayEnd },
      },
      select: { startTime: true, endTime: true },
    }),
  ])

  if (blackout) return []
  if (schedule && !schedule.isWorkingDay) return []
  if (!schedule && !((workingDays >> dayOfWeek) & 1)) return []

  const effectiveOpen = schedule ? schedule.startHour : openTime
  const effectiveClose = schedule ? schedule.endHour : closeTime

  const slots: Slot[] = []
  const openMinutes = effectiveOpen * 60
  const closeMinutes = effectiveClose * 60
  let offset = 0

  while (openMinutes + offset + duration <= closeMinutes) {
    const totalMinutes = openMinutes + offset
    const slotHour = Math.floor(totalMinutes / 60)
    const slotMinute = totalMinutes % 60

    const slotStart = new Date(Date.UTC(year, month - 1, day, slotHour, slotMinute, 0))
    const slotEnd = new Date(Date.UTC(year, month - 1, day, 0, totalMinutes + duration, 0))

    const taken = bookings.some(
      (b) => new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart
    )

    slots.push({ hour: slotHour, minute: slotMinute, available: !taken })
    offset += duration
  }

  return slots
}

export async function getUnavailableDates(
  tenantId: string,
  professionalId: string,
  weekStartStr: string,
  workingDays: number = 127  // bitmask bit0=Dom..bit6=Sáb; 127=all open (default)
): Promise<string[]> {
  const [y, m, d] = weekStartStr.split('-').map(Number)
  const weekStart = new Date(Date.UTC(y, m - 1, d))
  const weekEnd = new Date(Date.UTC(y, m - 1, d + 7))

  const [schedules, blackouts] = await Promise.all([
    prisma.professionalSchedule.findMany({
      where: { professionalId },
      select: { dayOfWeek: true, isWorkingDay: true },
    }),
    prisma.blackoutDate.findMany({
      where: {
        tenantId,
        OR: [{ professionalId }, { professionalId: null }],
        startDate: { lte: weekEnd },
        endDate: { gte: weekStart },
      },
      select: { startDate: true, endDate: true },
    }),
  ])

  const unavailable: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i))
    const dateStr = date.toISOString().slice(0, 10)
    const dow = date.getUTCDay()

    const sched = schedules.find((s) => s.dayOfWeek === dow)
    if (sched && !sched.isWorkingDay) { unavailable.push(dateStr); continue }
    if (!sched && !((workingDays >> dow) & 1)) { unavailable.push(dateStr); continue }

    if (blackouts.some((b) => b.startDate <= date && b.endDate >= date)) {
      unavailable.push(dateStr)
    }
  }

  return unavailable
}

export async function createPublicBooking(data: {//0
  tenantId: string
  professionalId: string
  serviceId: string | null
  date: string
  hour: number
  minute: number
  duration: number
  clientName: string
  clientPhone: string
  clientEmail: string
}): Promise<void> {
  const [year, month, day] = data.date.split('-').map(Number)

  const startMinutes = data.hour * 60 + data.minute
  const endMinutes = startMinutes + data.duration

  const startTime = new Date(Date.UTC(year, month - 1, day, data.hour, data.minute, 0))
  const endTime = new Date(Date.UTC(year, month - 1, day, Math.floor(endMinutes / 60), endMinutes % 60, 0))

  let serviceName: string | null = null
  if (data.serviceId) {
    const svc = await prisma.service.findUnique({
      where: { id: data.serviceId },
      select: { name: true },
    })
    serviceName = svc?.name ?? null
  }

  await prisma.booking.create({
    data: {
      tenantId: data.tenantId,
      professionalId: data.professionalId,
      serviceId: data.serviceId ?? undefined,
      serviceName,
      clientName: data.clientName,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      startTime,
      endTime,
      status: 'pending',
    },
  })

  // Send booking confirmation email
  if (data.clientEmail) {
    const [tenant, professional, template] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: data.tenantId }, select: { name: true } }),
      data.professionalId
        ? prisma.user.findUnique({ where: { id: data.professionalId }, select: { email: true } })
        : null,
      prisma.emailTemplate.findUnique({
        where: { tenantId_type: { tenantId: data.tenantId, type: 'booking_confirmation' } },
        select: { subject: true, body: true },
      }),
    ])

    const professionalName = professional?.email
      ? professional.email.split('@')[0].replace(/[._-]/g, ' ')
      : 'el profesional'

    try {
      await sendBookingConfirmationEmail({
        to: data.clientEmail,
        clientName: data.clientName,
        serviceName: serviceName ?? 'Servicio',
        professionalName,
        startTime,
        tenantName: tenant?.name ?? 'Reservo',
        template,
      })
    } catch (err) {
      console.warn('[email] Could not send booking confirmation email:', err)
    }
  }

  // Register client user — upsert avoids a race condition when two bookings
  // arrive simultaneously for the same new email address
  if (data.clientEmail) {
    await prisma.user.upsert({
      where: { email: data.clientEmail },
      update: {},
      create: {
        email: data.clientEmail,
        role: 'client',
        tenantId: data.tenantId,
        passwordHash: null,
      },
    })
  }
}
