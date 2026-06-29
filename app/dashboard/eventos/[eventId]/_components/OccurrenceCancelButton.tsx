'use client'
import { useState, useTransition } from 'react'
import { cancelOccurrence } from '@/app/actions/events'

export default function OccurrenceCancelButton({ occurrenceId }: { occurrenceId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-red-600 hover:underline cursor-pointer"
      >
        Cancelar fecha
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-600">¿Cancelar esta fecha?</span>
      <button
        onClick={() => startTransition(async () => { await cancelOccurrence(occurrenceId) })}
        disabled={isPending}
        className="text-xs font-medium text-red-600 hover:underline cursor-pointer disabled:opacity-50"
      >
        {isPending ? 'Cancelando…' : 'Confirmar'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
      >
        No
      </button>
    </div>
  )
}
