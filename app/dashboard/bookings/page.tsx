import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PageHeader from '../_components/PageHeader'
import CalendarView from './_components/CalendarView'
import BookingListView from './_components/BookingListView'
import { getWeekStart, toLocalISO, parseLocalDate } from './_components/calendarUtils'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; branch?: string; professional?: string; view?: string }>
}) {
  const { tenantId, userId, role } = await requireTenantId()
  const isPro = role === 'professional'
  const { week, branch: branchParam, professional: professionalParam, view } = await searchParams

  const isListView = isPro && view === 'list'

  const weekStart = week ? getWeekStart(parseLocalDate(week)) : getWeekStart(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const now = new Date()

  const [bookings, professionals, tenant, branches] = await Promise.all([
    isListView
      ? prisma.booking.findMany({
          where: { tenantId, professionalId: userId },
          select: { id: true, clientName: true, clientPhone: true, serviceName: true, startTime: true, endTime: true, status: true, professionalId: true },
          orderBy: { startTime: 'asc' },
        })
      : prisma.booking.findMany({
          where: {
            tenantId,
            startTime: { gte: weekStart, lt: weekEnd },
            ...(isPro ? { professionalId: userId } : {}),
            ...(branchParam ? { branchId: branchParam } : {}),
            ...(!isPro && professionalParam ? { professionalId: professionalParam } : {}),
          },
          select: { id: true, clientName: true, clientPhone: true, serviceName: true, startTime: true, endTime: true, status: true, professionalId: true },
          orderBy: { startTime: 'asc' },
        }),
    isPro ? Promise.resolve([]) : prisma.user.findMany({
      where: { tenantId, role: 'professional' },
      select: { id: true, email: true, services: { select: { id: true, name: true } } },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { openTime: true, closeTime: true },
    }),
    prisma.branch.findMany({
      where: { tenantId, ...(isPro ? { professionals: { some: { id: userId } } } : {}) },
      select: { id: true, name: true, openTime: true, closeTime: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // When multiple branches exist and none is selected, default to the first
  if (!isListView && branches.length > 1 && !branchParam) {
    const params = new URLSearchParams()
    params.set('week', toLocalISO(weekStart))
    params.set('branch', branches[0].id)
    if (professionalParam) params.set('professional', professionalParam)
    redirect(`/dashboard/bookings?${params.toString()}`)
  }

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

  if (isListView) {
    const nowISO = now.toISOString()
    const upcoming = serializedBookings.filter((b) => b.startTime >= nowISO)
    const past = [...serializedBookings.filter((b) => b.startTime < nowISO)].reverse()
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-6 max-w-2xl mx-auto">
        <PageHeader title="Mis reservas" description="Turnos próximos y pasados" />
        <BookingListView upcoming={upcoming} past={past} />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-6 max-w-full">
      <PageHeader title={isPro ? 'Mis reservas' : 'Reservas'} description={isPro ? 'Tu agenda semanal' : 'Turnos y citas del negocio'} />
      <CalendarView
        bookings={serializedBookings}
        professionals={professionals}
        weekStartISO={toLocalISO(weekStart)}
        dayStart={dayStart}
        dayEnd={dayEnd}
        branches={serializedBranches}
        selectedBranchId={branchParam ?? null}
        selectedProfessionalId={professionalParam ?? null}
        isPro={isPro}
      />
    </div>
  )
}
