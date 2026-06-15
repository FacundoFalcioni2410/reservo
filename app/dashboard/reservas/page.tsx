import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import PageHeader from '../_components/PageHeader'
import CalendarView from './_components/CalendarView'
import { getWeekStart, toLocalISO, parseLocalDate } from './_components/calendarUtils'

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; branch?: string }>
}) {
  const { tenantId } = await requireTenantId()
  const { week, branch: branchParam } = await searchParams

  const weekStart = week ? getWeekStart(parseLocalDate(week)) : getWeekStart(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [bookings, professionals, tenant, branches] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId,
        startTime: { gte: weekStart, lt: weekEnd },
        ...(branchParam ? { branchId: branchParam } : {}),
      },
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
    prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true, openTime: true, closeTime: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Use selected branch hours if set, fall back to tenant hours
  let dayStart = tenant?.openTime ?? 8
  let dayEnd = tenant?.closeTime ?? 20
  if (branchParam) {
    const selectedBranch = branches.find((b) => b.id === branchParam)
    if (selectedBranch) {
      dayStart = selectedBranch.openTime ?? dayStart
      dayEnd = selectedBranch.closeTime ?? dayEnd
    }
  }

  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status as string,
  }))

  const serializedBranches = branches.map((b) => ({ id: b.id, name: b.name }))

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-6 max-w-full">
      <PageHeader title="Reservas" description="Turnos y citas del negocio" />
      <CalendarView
        bookings={serializedBookings}
        professionals={professionals}
        weekStartISO={toLocalISO(weekStart)}
        dayStart={dayStart}
        dayEnd={dayEnd}
        branches={serializedBranches}
        selectedBranchId={branchParam ?? null}
      />
    </div>
  )
}
