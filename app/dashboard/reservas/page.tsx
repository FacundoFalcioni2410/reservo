import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'
import CalendarView from './_components/CalendarView'
import { getWeekStart, toLocalISO, parseLocalDate } from './_components/calendarUtils'

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { tenantId } = await requireTenantId()
  const { week } = await searchParams

  const weekStart = week ? getWeekStart(parseLocalDate(week)) : getWeekStart(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [bookings, professionals, tenant] = await Promise.all([
    prisma.booking.findMany({
      where: { tenantId, startTime: { gte: weekStart, lt: weekEnd } },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        serviceName: true,
        startTime: true,
        endTime: true,
        status: true,
        professionalId: true,
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.user.findMany({
      where: { tenantId, role: 'professional' },
      select: { id: true, email: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { openTime: true, closeTime: true },
    }),
  ])

  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status as string,
  }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-6 max-w-full">
      <PageHeader title="Reservas" description="Turnos y citas del negocio" />
      <CalendarView
        bookings={serializedBookings}
        professionals={professionals}
        weekStartISO={toLocalISO(weekStart)}
        dayStart={tenant?.openTime ?? 8}
        dayEnd={tenant?.closeTime ?? 20}
      />
    </div>
  )
}
