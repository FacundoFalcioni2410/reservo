'use client'
import type { ReactNode } from 'react'

type ModalProps = {
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidth?: string
  containerClass?: string
}

export default function Modal({
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'sm:max-w-md',
  containerClass = 'max-h-[92vh] overflow-y-auto',
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} sm:rounded-2xl rounded-t-2xl shadow-xl ${containerClass}`}>
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer transition flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
