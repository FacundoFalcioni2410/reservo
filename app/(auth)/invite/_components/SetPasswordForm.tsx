'use client'
import { useState, useActionState } from 'react'
import { setPasswordFromInvite } from '@/app/actions/invite'

const INPUT_CLASS =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition w-full'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function SetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(setPasswordFromInvite, undefined)
  const [showPass, setShowPass] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Email</label>
        <input type="email" value={email} disabled className={`${INPUT_CLASS} bg-zinc-50 text-zinc-500`} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Nueva contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPass ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={`${INPUT_CLASS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 cursor-pointer transition"
          >
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Repetir contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            name="confirm"
            type={showPass ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Repetí tu contraseña"
            className={`${INPUT_CLASS} pr-10`}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition"
      >
        {pending ? 'Guardando…' : 'Configurar contraseña'}
      </button>
    </form>
  )
}
