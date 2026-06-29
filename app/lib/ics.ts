// Generates an iCalendar (.ics) string per RFC 5545 — no external library needed.

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function generateICS({
  uid,
  title,
  description,
  location,
  start,
  end,
}: {
  uid: string
  title: string
  description?: string | null
  location?: string | null
  start: Date
  end: Date
}): string {
  const now = formatICSDate(new Date())
  const dtStart = formatICSDate(start)
  const dtEnd = formatICSDate(end)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Reservo//ES',
    'BEGIN:VEVENT',
    `UID:${uid}@reservo`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${foldLine(title)}`,
  ]

  if (description) lines.push(`DESCRIPTION:${foldLine(description)}`)
  if (location) lines.push(`LOCATION:${foldLine(location)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

// RFC 5545 §3.1: lines longer than 75 octets must be folded
function foldLine(value: string): string {
  const safe = value.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  if (safe.length <= 70) return safe

  const chunks: string[] = []
  let i = 0
  while (i < safe.length) {
    chunks.push(safe.slice(i, i + 70))
    i += 70
  }
  return chunks.join('\r\n ')
}
