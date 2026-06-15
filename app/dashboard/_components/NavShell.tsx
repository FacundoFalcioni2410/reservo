'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'

type Tenant = { name: string; logoUrl: string | null }

export default function NavShell({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar tenant={tenant} />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <Sidebar tenant={tenant} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer transition"
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-6 w-6 rounded object-cover" />
          ) : (
            <div className="h-6 w-6 rounded bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
              {tenant.name[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-zinc-900 truncate">{tenant.name}</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
