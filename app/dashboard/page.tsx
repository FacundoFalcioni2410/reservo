import { redirect } from 'next/navigation'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const SECTIONS = [
  {
    label: 'Reservas',
    description: 'Ver y gestionar los turnos agendados',
    href: '/dashboard/reservas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Profesionales',
    description: 'Administrar el equipo de trabajo',
    href: '/dashboard/profesionales',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Servicios',
    description: 'Configurar los servicios ofrecidos',
    href: '/dashboard/servicios',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9" />
        <path d="M14 17H5" />
        <circle cx="17" cy="17" r="3" />
        <circle cx="7" cy="7" r="3" />
      </svg>
    ),
  },
  {
    label: 'Sucursales',
    description: 'Gestionar ubicaciones del negocio',
    href: '/dashboard/sucursales',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
        <path d="M21 9H3" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    description: 'Ver y gestionar la base de clientes',
    href: '/dashboard/clientes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="23" x2="19" y1="11" y2="11" />
        <line x1="21" x2="21" y1="9" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Configuración',
    description: 'Ajustes y datos del negocio',
    href: '/dashboard/configuracion',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const { tenantId, role } = await requireTenantId()
  if (role === 'professional') redirect('/dashboard/reservas')
  const [tenant, branchCount, professionalCount] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true } }),
    prisma.branch.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, role: 'professional' } }),
  ])

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900">{tenant.name}</h1>
        <p className="text-sm text-zinc-500 mt-1">Panel de administración</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-zinc-200 px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Reservas hoy</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Profesionales</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-1">{professionalCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-zinc-200 px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Sucursales</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-1">{branchCount}</p>
        </div>
      </div>

      {/* Sections */}
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 sm:mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl border border-zinc-200 px-4 py-4 sm:px-5 sm:py-5 flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3 hover:border-zinc-400 hover:shadow-sm transition group"
          >
            <div className="text-zinc-400 group-hover:text-zinc-700 transition flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{s.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
