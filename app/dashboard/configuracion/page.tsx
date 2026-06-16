import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PageHeader from '../_components/PageHeader'
import TenantSettingsForm from './_components/TenantSettingsForm'
import EmailTemplatesForm from './_components/EmailTemplatesForm'
import ConfigTabs from './_components/ConfigTabs'
import IntegrationsSection from './_components/IntegrationsSection'

export default async function ConfiguracionPage() {
  const { tenantId, userId, role } = await requireTenantId()
  const isPro = role === 'professional'

  const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { googleRefreshToken: true } })
  const googleConnected = !!currentUser?.googleRefreshToken

  if (isPro) {
    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
        <PageHeader title="Configuración" description="Tus integraciones y ajustes" />
        <IntegrationsSection connected={googleConnected} />
      </div>
    )
  }

  const [tenant, emailTemplates] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true, phone: true, description: true, openTime: true, closeTime: true },
    }),
    prisma.emailTemplate.findMany({
      where: { tenantId },
      select: { type: true, subject: true, body: true },
    }),
  ])

  if (!tenant) notFound()

  const inviteTemplate = emailTemplates.find((t) => t.type === 'invite') ?? null
  const bookingTemplate = emailTemplates.find((t) => t.type === 'booking_confirmation') ?? null

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
      <PageHeader title="Configuración" description="Ajustes y datos del negocio" />
      <ConfigTabs
        general={<TenantSettingsForm tenant={tenant} />}
        emails={<EmailTemplatesForm inviteTemplate={inviteTemplate} bookingTemplate={bookingTemplate} />}
        integraciones={<IntegrationsSection connected={googleConnected} />}
      />
    </div>
  )
}
