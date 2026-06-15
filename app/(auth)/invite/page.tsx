import { prisma } from '@/lib/prisma'
import SetPasswordForm from './_components/SetPasswordForm'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  const invalid = (message: string) => (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 p-8 text-center">
        <p className="text-sm font-medium text-zinc-900 mb-1">Link inválido</p>
        <p className="text-sm text-zinc-500">{message}</p>
      </div>
    </div>
  )

  if (!token) return invalid('El link de invitación no es válido.')

  const user = await prisma.user.findUnique({
    where: { inviteToken: token },
    select: { email: true, inviteExpiry: true },
  })

  if (!user) return invalid('El link de invitación es inválido o ya fue usado.')
  if (!user.inviteExpiry || user.inviteExpiry < new Date()) {
    return invalid('El link de invitación expiró. Pedile al admin que te envíe uno nuevo.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Configurá tu contraseña</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Elegí una contraseña para acceder a tu cuenta profesional.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <SetPasswordForm token={token} email={user.email} />
        </div>
      </div>
    </div>
  )
}
