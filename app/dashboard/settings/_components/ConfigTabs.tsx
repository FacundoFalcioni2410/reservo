'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'general' | 'emails' | 'integrations'

const TAB_LABELS: Record<Tab, string> = {
  general: 'General',
  emails: 'Emails',
  integrations: 'Integraciones',
}

export default function ConfigTabs({
  general,
  emails,
  integrations,
}: {
  general: React.ReactNode
  emails: React.ReactNode
  integrations: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab') as Tab | null
  const active: Tab = rawTab && rawTab in TAB_LABELS ? rawTab : 'general'

  function goTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'general') params.delete('tab')
    else params.set('tab', tab)
    router.replace(`/dashboard/settings?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {(['general', 'emails', 'integrations'] as Tab[]).map((tab) => (
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
      {active === 'integrations' && integrations}
    </div>
  )
}
