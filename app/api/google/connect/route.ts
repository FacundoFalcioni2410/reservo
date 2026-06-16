import { NextResponse } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { getAuthUrl } from '@/app/lib/googleCalendar'

export async function GET() {
  const { userId, role } = await verifySession()
  const url = getAuthUrl(`${userId}:${role}`)
  return NextResponse.redirect(url)
}
