import { type NextRequest, NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/app/lib/googleCalendar'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

  const [userId, role] = state?.split(':') ?? []
  const configUrl = role === 'professional'
    ? `${appUrl}/pro/configuracion`
    : `${appUrl}/dashboard/configuracion?tab=integraciones`

  if (!code || !userId) {
    return NextResponse.redirect(`${configUrl}?error=google_auth_failed`)
  }

  try {
    await saveGoogleTokens(userId, code)
  } catch {
    return NextResponse.redirect(`${configUrl}?error=google_auth_failed`)
  }

  return NextResponse.redirect(`${configUrl}?success=google_connected`)
}
