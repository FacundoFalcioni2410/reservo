'use client'
import { useSearchParams } from 'next/navigation'

export default function IntegrationsSection({ connected }: { connected: boolean }) {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'google_connected'
  const error = searchParams.get('error') === 'google_auth_failed'

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Google Calendar conectado correctamente.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          No se pudo conectar Google Calendar. Intentá de nuevo.
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">Google Calendar</p>
            <p className="text-xs text-zinc-500">
              {connected
                ? 'Conectado — las reservas se sincronizan automáticamente'
                : 'Las reservas se agregan a tu calendario. Si el profesional no tiene su cuenta vinculada, se usa el calendario del admin.'}
            </p>
          </div>
        </div>

        {connected ? (
          <form action="/api/google/disconnect" method="POST">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors border border-zinc-200 rounded-lg px-3 py-1.5 hover:border-red-200"
            >
              Desconectar
            </button>
          </form>
        ) : (
          <a
            href="/api/google/connect"
            className="text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 transition-colors rounded-lg px-3 py-1.5"
          >
            Conectar
          </a>
        )}
      </div>
    </div>
  )
}
