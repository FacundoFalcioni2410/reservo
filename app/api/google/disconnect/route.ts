import { NextResponse } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { disconnectGoogleCalendar } from '@/app/lib/googleCalendar'

export async function POST() {
  const { userId, role } = await verifySession()
  await disconnectGoogleCalendar(userId)
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const redirect = role === 'professional'
    ? `${appUrl}/pro/configuracion`
    : `${appUrl}/dashboard/configuracion?tab=integraciones`
  return NextResponse.redirect(redirect)
}
