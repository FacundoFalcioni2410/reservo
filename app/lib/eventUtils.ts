import type { Event } from '@prisma/client'

/**
 * Computes upcoming occurrence dates for an event based on its recurrence rules.
 * Returns dates as ISO date strings ("YYYY-MM-DD").
 */
export function computeOccurrenceDates(
  event: Pick<Event, 'recurrenceType' | 'recurrenceDays' | 'startDate' | 'endDate'>,
  limit = 30,
  from: Date = new Date()
): string[] {
  if (event.recurrenceType === 'ONCE') {
    const d = toDateString(event.startDate)
    if (event.startDate >= from || isSameDay(event.startDate, from)) return [d]
    return []
  }

  // WEEKLY
  const results: string[] = []
  const cursor = new Date(from)
  cursor.setUTCHours(0, 0, 0, 0)

  const endDate = event.endDate ? new Date(event.endDate) : null

  // Walk day by day up to 2 years max to avoid infinite loops
  const maxDate = new Date(from)
  maxDate.setFullYear(maxDate.getFullYear() + 2)

  while (results.length < limit && cursor <= maxDate) {
    const dayBit = 1 << cursor.getUTCDay() // bit0=Sun...bit6=Sat
    if (
      cursor >= event.startDate &&
      (endDate === null || cursor <= endDate) &&
      (event.recurrenceDays & dayBit) !== 0
    ) {
      results.push(toDateString(cursor))
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return results
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateString(a) === toDateString(b)
}

/** Returns the start Date for an occurrence given the event time string ("HH:mm") and date string ("YYYY-MM-DD"). */
export function buildOccurrenceStart(dateStr: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCHours(hours, minutes, 0, 0)
  return d
}

export function buildOccurrenceEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60 * 1000)
}
