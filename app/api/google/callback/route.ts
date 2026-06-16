import { type NextRequest, NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/app/lib/googleCalendar'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/configuracion?tab=integraciones&error=google_auth_failed`)
  }

  try {
    await saveGoogleTokens(userId, code)
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/configuracion?tab=integraciones&error=google_auth_failed`)
  }

  return NextResponse.redirect(`${appUrl}/dashboard/configuracion?tab=integraciones&success=google_connected`)
}
