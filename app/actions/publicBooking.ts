'use server'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmationEmail } from '@/app/lib/email'

export type Slot = { hour: number; minute: number; available: boolean }

export async function getAvailableSlots(
  tenantId: string,
  professionalId: string,
  dateStr: string,
  openTime: number,   // whole hours (e.g. 8)
  closeTime: number,  // whole hours (e.g. 20)
  duration: number    // minutes (e.g. 30, 60, 90)
): Promise<Slot[]> {
  const [year, month, day] = dateStr.split('-').map(Number)

  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const dayEnd = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0))

  const bookings = await prisma.booking.findMany({
    where: {
      tenantId,
      professionalId,
      status: { not: 'cancelled' },
      startTime: { gte: dayStart, lt: dayEnd },
    },
    select: { startTime: true, endTime: true },
  })

  const slots: Slot[] = []
  const openMinutes = openTime * 60
  const closeMinutes = closeTime * 60
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

  // Register client user if the email doesn't exist yet in the system
  if (data.clientEmail) {
    const exists = await prisma.user.findUnique({ where: { email: data.clientEmail } })
    if (!exists) {
      await prisma.user.create({
        data: {
          email: data.clientEmail,
          role: 'client',
          tenantId: data.tenantId,
          passwordHash: null,
        },
      })
    }
  }
}
