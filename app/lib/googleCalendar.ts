import 'server-only'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/google/callback`,
  )
}

export function getAuthUrl(userId: string) {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: userId,
    prompt: 'consent',
  })
}

export async function saveGoogleTokens(userId: string, code: string) {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token,
      ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
    },
  })
}

export async function disconnectGoogleCalendar(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { googleAccessToken: null, googleRefreshToken: null },
  })
}

async function getCalendarClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true },
  })
  if (!user?.googleRefreshToken) {
    console.log(`[google-calendar] user ${userId} has no refresh token — skipping sync`)
    return null
  }

  const client = getOAuthClient()
  client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  })
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { googleAccessToken: tokens.access_token },
      })
    }
  })

  return google.calendar({ version: 'v3', auth: client })
}

export async function createCalendarEvent(
  userId: string,
  event: { summary: string; description?: string | null; startTime: Date; endTime: Date },
): Promise<string | null> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return null

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description ?? undefined,
      start: { dateTime: event.startTime.toISOString() },
      end: { dateTime: event.endTime.toISOString() },
    },
  })

  return res.data.id ?? null
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
  const calendar = await getCalendarClient(userId)
  if (!calendar) return
  await calendar.events.delete({ calendarId: 'primary', eventId })
}
