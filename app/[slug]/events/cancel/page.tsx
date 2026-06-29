import Link from 'next/link'
import { cancelAttendance } from '@/app/actions/publicEvents'

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 max-w-sm w-full text-center">
          <p className="text-sm text-zinc-500">Token inválido o expirado.</p>
          <Link href={`/${slug}/eventos`} className="mt-4 inline-block text-sm text-zinc-900 underline underline-offset-2">
            Volver a eventos
          </Link>
        </div>
      </div>
    )
  }

  const result = await cancelAttendance(token)

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-8 max-w-sm w-full text-center">
        {'error' in result ? (
          <>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h1 className="text-base font-semibold text-zinc-900">No se pudo cancelar</h1>
            <p className="text-sm text-zinc-500 mt-1">{result.error}</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="text-base font-semibold text-zinc-900">Inscripción cancelada</h1>
            <p className="text-sm text-zinc-500 mt-1">Tu lugar fue liberado. Si alguien estaba en lista de espera, se le notificará automáticamente.</p>
          </>
        )}
        <Link href={`/${slug}/eventos`} className="mt-5 inline-block text-sm text-zinc-900 underline underline-offset-2">
          Volver a eventos
        </Link>
      </div>
    </div>
  )
}
