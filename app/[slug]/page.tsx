import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BookingFlow from './_components/BookingFlow'

function formatDisplayName(email: string) {
  const username = email.split('@')[0]
  return username
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      logoUrl: true,
      openTime: true,
      closeTime: true,
    },
  })

  if (!tenant) notFound()

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, description: true, price: true, imageUrl: true, duration: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        role: 'professional',
        passwordHash: { not: null },
      },
      select: {
        id: true,
        email: true,
        services: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (professionals.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-base font-semibold text-zinc-900">{tenant.name}</p>
        <p className="text-sm text-zinc-400">Este negocio no tiene turnos disponibles por el momento.</p>
      </div>
    )
  }

  return (
    <BookingFlow
      tenant={tenant}
      services={services.map((s) => ({ ...s, price: s.price !== null ? Number(s.price) : null, duration: s.duration }))}
      professionals={professionals.map((p) => ({
        id: p.id,
        displayName: formatDisplayName(p.email),
        serviceIds: p.services.map((s) => s.id),
      }))}
    />
  )
}
