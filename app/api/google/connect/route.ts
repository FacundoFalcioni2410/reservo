import { NextResponse } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { getAuthUrl } from '@/app/lib/googleCalendar'

export async function GET() {
  const { userId } = await verifySession()
  const url = getAuthUrl(userId)
  return NextResponse.redirect(url)
}
