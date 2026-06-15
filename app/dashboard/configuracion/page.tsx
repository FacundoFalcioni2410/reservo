import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PageHeader from '../_components/PageHeader'
import TenantSettingsForm from './_components/TenantSettingsForm'

export default async function ConfiguracionPage() {
  const { tenantId } = await requireTenantId()

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      slug: true,
      phone: true,
      description: true,
      openTime: true,
      closeTime: true,
    },
  })

  if (!tenant) notFound()

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <PageHeader title="Configuración" description="Ajustes y datos del negocio" />
      <TenantSettingsForm tenant={tenant} />
    </div>
  )
}
