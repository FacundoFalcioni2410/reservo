'use client'
import { useState } from 'react'

type Tab = 'general' | 'emails'

export default function ConfigTabs({
  general,
  emails,
}: {
  general: React.ReactNode
  emails: React.ReactNode
}) {
  const [active, setActive] = useState<Tab>('general')

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {(['general', 'emails'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              active === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {tab === 'general' ? 'General' : 'Emails'}
          </button>
        ))}
      </div>
      {active === 'general' ? general : emails}
    </div>
  )
}
