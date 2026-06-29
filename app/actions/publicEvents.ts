'use server'
import { prisma } from '@/lib/prisma'
import {
  sendEventRegistrationPendingEmail,
  sendEventConfirmationEmail,
  sendWaitlistPromotionEmail,
} from '@/app/lib/email'
import {
  computeOccurrenceDates,
  buildOccurrenceStart,
  buildOccurrenceEnd,
} from '@/app/lib/eventUtils'
import { createCalendarEvent } from '@/app/lib/googleCalendar'

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
const CONFIRMATION_EXPIRY_MINUTES = 60

function isExpired(attendee: { expiresAt: Date | null }): boolean {
  return attendee.expiresAt !== null && attendee.expiresAt < new Date()
}

export async function getPublicEvents(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return null

  const events = await prisma.event.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { startDate: 'asc' },
  })

  return events.map((e) => ({
    ...e,
    nextDates: computeOccurrenceDates(e, 3),
  }))
}

export async function getPublicEventDetail(tenantSlug: string, eventId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return null

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: tenant.id, isActive: true },
    include: { professionals: { select: { id: true, email: true } } },
  })
  if (!event) return null

  const upcomingDates = computeOccurrenceDates(event, 10)

  const occurrences = await prisma.eventOccurrence.findMany({
    where: { eventId, isCancelled: false },
    include: {
      attendees: { where: { status: { not: 'CANCELLED' } } },
    },
  })

  const now = new Date()
  type OccurrenceCounts = { confirmed: number; pending: number }
  const countByDate: Record<string, OccurrenceCounts> = {}

  for (const occ of occurrences) {
    const key = occ.date.toISOString().slice(0, 10)
    let confirmed = 0
    let pending = 0
    for (const a of occ.attendees) {
      if (a.status === 'CONFIRMED') confirmed++
      else if (a.status === 'PENDING_CONFIRMATION' && a.expiresAt && a.expiresAt > now) pending++
    }
    countByDate[key] = { confirmed, pending }
  }

  return {
    event,
    tenantName: tenant.name,
    upcomingDates: upcomingDates.map((d) => {
      const counts = countByDate[d] ?? { confirmed: 0, pending: 0 }
      const activeCount = counts.confirmed + counts.pending
      return {
        date: d,
        confirmedCount: counts.confirmed,
        pendingCount: counts.pending,
        availableCount: Math.max(0, event.maxAttendees - activeCount),
        isFull: activeCount >= event.maxAttendees,
      }
    }),
  }
}

export async function registerForOccurrence(
  tenantSlug: string,
  eventId: string,
  dateStr: string,
  clientName: string,
  clientEmail: string,
  clientPhone: string
) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return { error: 'Negocio no encontrado.' }

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: tenant.id, isActive: true },
    include: { professionals: { select: { id: true, email: true, googleRefreshToken: true } } },
  })
  if (!event) return { error: 'Evento no encontrado.' }

  const validDates = computeOccurrenceDates(event, 60)
  if (!validDates.includes(dateStr)) return { error: 'Fecha no válida para este evento.' }

  // Check for duplicate active registration
  const existingOccurrence = await prisma.eventOccurrence.findUnique({
    where: { eventId_date: { eventId, date: new Date(dateStr) } },
    include: {
      attendees: {
        where: { clientEmail, status: { notIn: ['CANCELLED'] } },
      },
    },
  })
  if (existingOccurrence?.attendees.length) {
    return { error: 'Ya tenés una inscripción activa para esta fecha.' }
  }

  // Upsert occurrence (lazy creation)
  const now = new Date()
  const occurrence = await prisma.eventOccurrence.upsert({
    where: { eventId_date: { eventId, date: new Date(dateStr) } },
    create: { eventId, date: new Date(dateStr) },
    update: {},
    include: {
      attendees: { where: { status: { notIn: ['CANCELLED', 'WAITLISTED'] } } },
    },
  })

  if (occurrence.isCancelled) return { error: 'Esta fecha fue cancelada.' }

  // Count active spots (CONFIRMED + non-expired PENDING_CONFIRMATION)
  const activeCount = occurrence.attendees.filter(
    (a) => a.status === 'CONFIRMED' || (a.status === 'PENDING_CONFIRMATION' && a.expiresAt && a.expiresAt > now)
  ).length
  const isFull = activeCount >= event.maxAttendees

  const expiresAt = new Date(now.getTime() + CONFIRMATION_EXPIRY_MINUTES * 60 * 1000)
  const status = isFull ? 'WAITLISTED' : 'PENDING_CONFIRMATION'

  const attendee = await prisma.eventAttendee.create({
    data: {
      occurrenceId: occurrence.id,
      clientName,
      clientEmail,
      clientPhone,
      status,
      expiresAt: status === 'PENDING_CONFIRMATION' ? expiresAt : null,
    },
  })

  const start = buildOccurrenceStart(dateStr, event.time)
  const end = buildOccurrenceEnd(start, event.durationMinutes)

  if (status === 'PENDING_CONFIRMATION') {
    const confirmationUrl = `${APP_URL}/${tenantSlug}/eventos/confirm?token=${attendee.confirmationToken}`
    const cancellationUrl = `${APP_URL}/${tenantSlug}/eventos/cancel?token=${attendee.cancellationToken}`

    await sendEventRegistrationPendingEmail({
      to: clientEmail,
      clientName,
      eventTitle: event.title,
      location: event.location,
      tenantName: tenant.name,
      start,
      confirmationUrl,
      cancellationUrl,
    }).catch((e) => console.error('[email error]', e))
  }

  return { status }
}

export async function confirmAttendance(confirmationToken: string) {
  const attendee = await prisma.eventAttendee.findUnique({
    where: { confirmationToken },
    include: {
      occurrence: {
        include: {
          event: {
            include: {
              tenant: true,
              professionals: { select: { id: true, email: true, googleRefreshToken: true } },
            },
          },
          professionalEntries: true,
        },
      },
    },
  })

  if (!attendee) return { error: 'Token inválido.' }
  if (attendee.status === 'CONFIRMED') return { alreadyConfirmed: true }
  if (attendee.status === 'CANCELLED') return { error: 'Esta inscripción fue cancelada.' }
  if (attendee.status === 'WAITLISTED') return { error: 'Estás en lista de espera, no en espera de confirmación.' }

  // Check expiry
  const now = new Date()
  if (attendee.expiresAt && attendee.expiresAt < now) {
    await prisma.eventAttendee.update({ where: { id: attendee.id }, data: { status: 'CANCELLED' } })
    return { error: 'El link de confirmación expiró. Tu lugar fue liberado. Podés volver a inscribirte.' }
  }

  await prisma.eventAttendee.update({
    where: { id: attendee.id },
    data: { status: 'CONFIRMED', expiresAt: null },
  })

  const { occurrence } = attendee
  const { event } = occurrence
  const dateStr = occurrence.date.toISOString().slice(0, 10)
  const start = buildOccurrenceStart(dateStr, event.time)
  const end = buildOccurrenceEnd(start, event.durationMinutes)
  const cancellationUrl = `${APP_URL}/${event.tenant.slug}/eventos/cancel?token=${attendee.cancellationToken}`

  // Send confirmation email with .ics
  await sendEventConfirmationEmail({
    to: attendee.clientEmail,
    clientName: attendee.clientName,
    eventTitle: event.title,
    location: event.location,
    description: event.description,
    tenantName: event.tenant.name,
    occurrenceId: occurrence.id,
    start,
    end,
    cancellationUrl,
  }).catch((e) => console.error('[email error]', e))

  // Sync Google Calendar for professionals if this is the first confirmed attendee on this occurrence
  const existingEntries = occurrence.professionalEntries
  const professionalsWithoutEntry = event.professionals.filter(
    (p) => !existingEntries.some((e) => e.professionalId === p.id) && p.googleRefreshToken
  )

  if (professionalsWithoutEntry.length > 0) {
    await Promise.allSettled(
      professionalsWithoutEntry.map(async (prof) => {
        const calEventId = await createCalendarEvent(prof.id, {
          summary: `${event.title} (evento)`,
          description: event.description,
          startTime: start,
          endTime: end,
        })
        if (calEventId) {
          await prisma.eventOccurrenceProfessional.upsert({
            where: { occurrenceId_professionalId: { occurrenceId: occurrence.id, professionalId: prof.id } },
            create: { occurrenceId: occurrence.id, professionalId: prof.id, googleCalendarEventId: calEventId },
            update: { googleCalendarEventId: calEventId },
          })
        }
      })
    )
  }

  return { success: true, eventTitle: event.title, start: start.toISOString() }
}

export async function cancelAttendance(cancellationToken: string) {
  const attendee = await prisma.eventAttendee.findUnique({
    where: { cancellationToken },
    include: {
      occurrence: {
        include: {
          event: { include: { tenant: true } },
        },
      },
    },
  })

  if (!attendee) return { error: 'Token inválido.' }
  if (attendee.status === 'CANCELLED') return { error: 'Ya cancelaste tu inscripción.' }

  await prisma.eventAttendee.update({
    where: { id: attendee.id },
    data: { status: 'CANCELLED' },
  })

  // Promote first WAITLISTED person
  const nextWaitlisted = await prisma.eventAttendee.findFirst({
    where: { occurrenceId: attendee.occurrenceId, status: 'WAITLISTED' },
    orderBy: { registeredAt: 'asc' },
  })

  if (nextWaitlisted) {
    const expiresAt = new Date(Date.now() + CONFIRMATION_EXPIRY_MINUTES * 60 * 1000)
    await prisma.eventAttendee.update({
      where: { id: nextWaitlisted.id },
      data: { status: 'PENDING_CONFIRMATION', expiresAt },
    })

    const { occurrence } = attendee
    const { event } = occurrence
    const dateStr = occurrence.date.toISOString().slice(0, 10)
    const start = buildOccurrenceStart(dateStr, event.time)
    const end = buildOccurrenceEnd(start, event.durationMinutes)
    const confirmationUrl = `${APP_URL}/${event.tenant.slug}/eventos/confirm?token=${nextWaitlisted.confirmationToken}`
    const cancellationUrl = `${APP_URL}/${event.tenant.slug}/eventos/cancel?token=${nextWaitlisted.cancellationToken}`

    await sendWaitlistPromotionEmail({
      to: nextWaitlisted.clientEmail,
      clientName: nextWaitlisted.clientName,
      eventTitle: event.title,
      location: event.location,
      description: event.description,
      tenantName: event.tenant.name,
      occurrenceId: occurrence.id,
      start,
      end,
      cancellationUrl,
      confirmationUrl,
    }).catch((e) => console.error('[email error]', e))
  }

  return { success: true }
}
