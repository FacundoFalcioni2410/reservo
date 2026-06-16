'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'general' | 'emails' | 'integraciones'

const TAB_LABELS: Record<Tab, string> = {
  general: 'General',
  emails: 'Emails',
  integraciones: 'Integraciones',
}

export default function ConfigTabs({
  general,
  emails,
  integraciones,
}: {
  general: React.ReactNode
  emails: React.ReactNode
  integraciones: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab') as Tab | null
  const active: Tab = rawTab && rawTab in TAB_LABELS ? rawTab : 'general'

  function goTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'general') params.delete('tab')
    else params.set('tab', tab)
    router.replace(`/dashboard/configuracion?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {(['general', 'emails', 'integraciones'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => goTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              active === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      {active === 'general' && general}
      {active === 'emails' && emails}
      {active === 'integraciones' && integraciones}
    </div>
  )
}
