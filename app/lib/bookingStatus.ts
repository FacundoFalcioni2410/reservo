export const BOOKING_STATUS: Record<string, { label: string; badgeClass: string; calendarClass: string }> = {
  pending:   { label: 'Pendiente',  badgeClass: 'bg-yellow-100 text-yellow-700', calendarClass: 'bg-yellow-50 border-yellow-300 text-yellow-900' },
  confirmed: { label: 'Confirmada', badgeClass: 'bg-blue-100 text-blue-700',    calendarClass: 'bg-blue-50 border-blue-300 text-blue-900' },
  completed: { label: 'Completada', badgeClass: 'bg-green-100 text-green-700',  calendarClass: 'bg-green-50 border-green-300 text-green-900' },
  cancelled: { label: 'Cancelada',  badgeClass: 'bg-red-100 text-red-600',      calendarClass: 'bg-zinc-100 border-zinc-300 text-zinc-500 line-through' },
}
