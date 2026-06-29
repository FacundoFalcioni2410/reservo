import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import EventsClient from './_components/EventsClient'

function formatDisplayName(email: string) {
  return email.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

export default async function EventosPage() {
  const { tenantId } = await requireTenantId()

  const [events, professionals] = await Promise.all([
    prisma.event.findMany({
      where: { tenantId },
      include: { professionals: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { tenantId, role: 'professional', passwordHash: { not: null } },
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-3xl mx-auto">
      <EventsClient
        events={events}
        professionals={professionals.map((p) => ({
          id: p.id,
          displayName: formatDisplayName(p.email),
        }))}
      />
    </div>
  )
}
