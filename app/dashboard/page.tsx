import { verifySession } from '@/app/lib/dal'
import { logout } from '@/app/actions/auth'

export default async function DashboardPage() {
  const session = await verifySession()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Reservo</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 capitalize">{session.role}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Dashboard</h2>
        <p className="text-zinc-500">Bienvenido. Tu panel estará disponible pronto.</p>
      </main>
    </div>
  )
}
