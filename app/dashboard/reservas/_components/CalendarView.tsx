'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import NewBookingModal from './NewBookingModal'
import { updateBookingStatus } from '@/app/actions/bookings'
import { getWeekStart, toLocalISO } from './calendarUtils'

const DAY_START = 7
const DAY_END = 21
const PX_PER_HOUR = 64
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
const TOTAL_HEIGHT = (DAY_END - DAY_START) * PX_PER_HOUR

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  confirmed: 'bg-blue-50 border-blue-300 text-blue-900',
  cancelled: 'bg-zinc-100 border-zinc-300 text-zinc-500 line-through',
  completed: 'bg-green-50 border-green-300 text-green-900',
}

type BookingData = {
  id: string
  clientName: string
  clientPhone: string | null
  serviceName: string | null
  startTime: string
  endTime: string
  status: string
  professionalId: string | null
}

type Professional = { id: string; email: string }
type ModalPrefill = { date: string; startTime: string; endTime: string }

function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function pad2(n: number) { return String(n).padStart(2, '0') }

function formatHour(h: number) {
  return `${pad2(h)}:00`
}

function getTop(startISO: string): number {
  const d = new Date(startISO)
  const hours = d.getHours() + d.getMinutes() / 60
  return Math.max(0, (hours - DAY_START) * PX_PER_HOUR)
}

function getHeight(startISO: string, endISO: string): number {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const hours = (end.getTime() - start.getTime()) / 3_600_000
  return Math.max(hours * PX_PER_HOUR, 24)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function weekLabel(weekStart: Date) {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${weekStart.getDate()}–${end.getDate()} ${MONTHS_ES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
  }
  return `${weekStart.getDate()} ${MONTHS_ES[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_ES[end.getMonth()]} ${weekStart.getFullYear()}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ─── Overlap layout ──────────────────────────────────────────────────────────

type PositionedBooking = BookingData & { col: number; totalCols: number }

function overlaps(a: BookingData, b: BookingData) {
  return (
    new Date(a.startTime).getTime() < new Date(b.endTime).getTime() &&
    new Date(a.endTime).getTime() > new Date(b.startTime).getTime()
  )
}

function layoutBookings(bookings: BookingData[]): PositionedBooking[] {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Assign each booking to the first available column
  const columns: string[][] = [] // columns[c] = list of endTime ISO strings
  const assigned: { booking: BookingData; col: number }[] = []

  for (const booking of sorted) {
    let placed = false
    for (let c = 0; c < columns.length; c++) {
      const lastEnd = columns[c][columns[c].length - 1]
      if (new Date(lastEnd).getTime() <= new Date(booking.startTime).getTime()) {
        columns[c].push(booking.endTime)
        assigned.push({ booking, col: c })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([booking.endTime])
      assigned.push({ booking, col: columns.length - 1 })
    }
  }

  // For each booking, totalCols = widest overlap group it belongs to
  return assigned.map(({ booking, col }) => {
    let maxCol = col
    for (const other of assigned) {
      if (other.col > maxCol && overlaps(booking, other.booking)) {
        maxCol = other.col
      }
    }
    return { ...booking, col, totalCols: maxCol + 1 }
  })
}

const GAP = 2 // px between sub-columns

// ─── Day column ──────────────────────────────────────────────────────────────

function DayColumn({
  day,
  bookings,
  onSlotClick,
  onBookingClick,
}: {
  day: Date
  bookings: BookingData[]
  onSlotClick: (date: Date, hour: number) => void
  onBookingClick: (b: BookingData) => void
}) {
  const isToday = isSameDay(day, new Date())
  const positioned = layoutBookings(bookings)

  return (
    <div className="relative flex-1 border-l border-zinc-100" style={{ height: TOTAL_HEIGHT }}>
      {/* Hour lines + click zones */}
      {HOURS.map((h) => (
        <div
          key={h}
          style={{ top: (h - DAY_START) * PX_PER_HOUR, height: PX_PER_HOUR }}
          className="absolute w-full border-t border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-colors"
          onClick={() => onSlotClick(day, h)}
        />
      ))}

      {/* Bookings */}
      {positioned.map((b) => {
        const top = getTop(b.startTime)
        const height = getHeight(b.startTime, b.endTime)
        if (top + height < 0 || top > TOTAL_HEIGHT) return null
        const pct = 100 / b.totalCols
        const left = `calc(${b.col * pct}% + ${GAP}px)`
        const right = `calc(${(b.totalCols - b.col - 1) * pct}% + ${GAP}px)`
        return (
          <div
            key={b.id}
            style={{ top, height, left, right }}
            className={`absolute rounded border px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer hover:brightness-95 transition ${STATUS_STYLES[b.status] ?? STATUS_STYLES.pending}`}
            onClick={(e) => { e.stopPropagation(); onBookingClick(b) }}
          >
            <p className="font-medium truncate leading-tight">{b.clientName}</p>
            {height >= 40 && b.serviceName && (
              <p className="truncate opacity-70 leading-tight">{b.serviceName}</p>
            )}
            {height >= 56 && (
              <p className="opacity-60 leading-tight">{formatTime(b.startTime)}–{formatTime(b.endTime)}</p>
            )}
          </div>
        )
      })}

      {/* Current time line */}
      {isToday && (() => {
        const now = new Date()
        const top = (now.getHours() + now.getMinutes() / 60 - DAY_START) * PX_PER_HOUR
        if (top < 0 || top > TOTAL_HEIGHT) return null
        return (
          <div style={{ top }} className="absolute left-0 right-0 flex items-center pointer-events-none z-10">
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
            <div className="flex-1 border-t border-red-500" />
          </div>
        )
      })()}
    </div>
  )
}

// ─── Booking detail ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

function BookingDetail({ booking, onClose }: { booking: BookingData; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()

  function handleStatus(status: 'confirmed' | 'cancelled') {
    startTransition(async () => {
      await updateBookingStatus(booking.id, status)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">{booking.clientName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <dl className="flex flex-col gap-2 text-sm mb-5">
          {booking.clientPhone && (
            <div className="flex gap-2"><dt className="text-zinc-500 w-24 flex-shrink-0">Teléfono</dt><dd className="text-zinc-900">{booking.clientPhone}</dd></div>
          )}
          {booking.serviceName && (
            <div className="flex gap-2"><dt className="text-zinc-500 w-24 flex-shrink-0">Servicio</dt><dd className="text-zinc-900">{booking.serviceName}</dd></div>
          )}
          <div className="flex gap-2">
            <dt className="text-zinc-500 w-24 flex-shrink-0">Horario</dt>
            <dd className="text-zinc-900">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-500 w-24 flex-shrink-0">Estado</dt>
            <dd>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[booking.status]}`}>
                {STATUS_LABELS[booking.status]}
              </span>
            </dd>
          </div>
        </dl>

        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <div className="flex gap-2">
            {booking.status === 'pending' && (
              <button
                onClick={() => handleStatus('confirmed')}
                disabled={isPending}
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition"
              >
                Confirmar
              </button>
            )}
            <button
              onClick={() => handleStatus('cancelled')}
              disabled={isPending}
              className="text-sm px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer transition"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main CalendarView ────────────────────────────────────────────────────────

export default function CalendarView({
  bookings,
  professionals,
  weekStartISO,
}: {
  bookings: BookingData[]
  professionals: Professional[]
  weekStartISO: string
}) {
  const router = useRouter()
  const weekStart = new Date(weekStartISO)
  const days = getWeekDays(weekStart)
  const today = new Date()

  const [modal, setModal] = useState<ModalPrefill | null>(null)
  const [detail, setDetail] = useState<BookingData | null>(null)
  const [mobileDay, setMobileDay] = useState<Date>(() => {
    const todayInWeek = days.find((d) => isSameDay(d, today))
    return todayInWeek ?? days[0]
  })

  function goWeek(offset: number) {
    const d = addDays(weekStart, offset * 7)
    router.push(`/dashboard/reservas?week=${toLocalISO(d)}`)
  }

  function openSlot(date: Date, hour: number) {
    setModal({
      date: toLocalISO(date),
      startTime: formatHour(hour),
      endTime: formatHour(Math.min(hour + 1, DAY_END)),
    })
  }

  function openNew() {
    setModal({
      date: toLocalISO(today),
      startTime: formatHour(Math.min(Math.max(today.getHours(), DAY_START), DAY_END - 1)),
      endTime: formatHour(Math.min(today.getHours() + 1, DAY_END)),
    })
  }

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.startTime), day))

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goWeek(-1)}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 cursor-pointer transition"
            aria-label="Semana anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-zinc-700 min-w-[160px] text-center">{weekLabel(weekStart)}</span>
          <button
            onClick={() => goWeek(1)}
            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 cursor-pointer transition"
            aria-label="Semana siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => router.push(`/dashboard/reservas?week=${toLocalISO(getWeekStart(today))}`)}
            className="hidden sm:block text-xs px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer transition"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-700 cursor-pointer transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Nueva reserva</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* ── Mobile: day tabs + list ── */}
      <div className="sm:hidden">
        <div className="flex border-b border-zinc-200 mb-3 overflow-x-auto">
          {days.map((day) => {
            const active = isSameDay(day, mobileDay)
            const isToday = isSameDay(day, today)
            const count = bookingsForDay(day).length
            return (
              <button
                key={day.toISOString()}
                onClick={() => setMobileDay(day)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2 text-xs font-medium border-b-2 transition cursor-pointer ${
                  active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <span>{DAYS_ES[day.getDay()]}</span>
                <span className={`text-sm font-semibold mt-0.5 ${isToday ? 'bg-zinc-900 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </span>
                {count > 0 && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2">
          {bookingsForDay(mobileDay).length === 0 ? (
            <button
              onClick={() => openSlot(mobileDay, 9)}
              className="w-full py-10 text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl hover:border-zinc-400 transition cursor-pointer"
            >
              Sin reservas · Tocá para agregar
            </button>
          ) : (
            bookingsForDay(mobileDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((b) => (
                <button
                  key={b.id}
                  onClick={() => setDetail(b)}
                  className={`w-full text-left px-4 py-3 rounded-xl border cursor-pointer transition hover:brightness-95 ${STATUS_STYLES[b.status]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{b.clientName}</p>
                      {b.serviceName && <p className="text-xs opacity-70 mt-0.5">{b.serviceName}</p>}
                    </div>
                    <span className="text-xs flex-shrink-0 mt-0.5">{formatTime(b.startTime)}–{formatTime(b.endTime)}</span>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* ── Desktop: week grid ── */}
      <div className="hidden sm:flex flex-col border border-zinc-200 rounded-xl overflow-hidden bg-white">
        {/* Day headers */}
        <div className="flex border-b border-zinc-200 bg-zinc-50">
          <div className="w-14 flex-shrink-0" />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div key={day.toISOString()} className="flex-1 text-center py-2 border-l border-zinc-200 first:border-l-0">
                <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-zinc-500'}`}>
                  {DAYS_ES[day.getDay()]}
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-zinc-900'}`}>
                  {day.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="flex overflow-y-auto" style={{ maxHeight: 600 }}>
          {/* Hours column */}
          <div className="w-14 flex-shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ top: (h - DAY_START) * PX_PER_HOUR }}
                className="absolute w-full pr-2 flex justify-end"
              >
                <span className="text-xs text-zinc-400 -translate-y-2">{pad2(h)}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              bookings={bookingsForDay(day)}
              onSlotClick={openSlot}
              onBookingClick={setDetail}
            />
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal && (
        <NewBookingModal
          professionals={professionals}
          defaultDate={modal.date}
          defaultStartTime={modal.startTime}
          defaultEndTime={modal.endTime}
          onClose={() => setModal(null)}
        />
      )}
      {detail && (
        <BookingDetail booking={detail} onClose={() => setDetail(null)} />
      )}
    </>
  )
}

