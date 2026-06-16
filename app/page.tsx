import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

export default async function Home() {
  const session = await getSession()
  if (session?.userId) redirect('/dashboard')
  return (
    <div className="bg-white text-zinc-900 font-sans">

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">reservo</span>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition"
          >
            Ingresar →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-16 px-6 max-w-5xl mx-auto">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-6">
          Sistema de turnos
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] text-zinc-900 max-w-2xl mb-6">
          Tus clientes reservan solos.
          <br />
          <span className="text-zinc-400">Vos controlás todo.</span>
        </h1>
        <p className="text-lg text-zinc-500 max-w-lg mb-10 leading-relaxed">
          Un panel de turnos para negocios que trabajan con agenda. Sin llamadas,
          sin hojas de cálculo. Cada cliente reserva desde tu página, vos lo ves
          en tiempo real.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-700 transition"
          >
            Empezar gratis
          </Link>
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* UI Preview */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-xl shadow-zinc-100">
          {/* Window chrome */}
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <div className="ml-4 flex-1 bg-zinc-200 rounded-md h-5 max-w-[200px]" />
          </div>

          {/* Dashboard shell */}
          <div className="flex bg-white" style={{ minHeight: 380 }}>

            {/* Sidebar */}
            <div className="w-48 bg-zinc-900 flex-shrink-0 p-3 flex flex-col gap-1 hidden sm:flex">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
                <div className="w-6 h-6 rounded bg-zinc-700 flex-shrink-0" />
                <div className="h-3 w-20 bg-zinc-700 rounded" />
              </div>
              {['Reservas', 'Profesionales', 'Clientes', 'Servicios', 'Sucursales'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${i === 0 ? 'bg-zinc-800' : ''}`}
                >
                  <div className="w-3.5 h-3.5 rounded bg-zinc-700 flex-shrink-0" />
                  <span className={`text-xs ${i === 0 ? 'text-white' : 'text-zinc-500'}`}>{item}</span>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div className="flex-1 p-5 overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-zinc-100" />
                  <div className="w-5 h-5 rounded bg-zinc-100" />
                  <div className="h-3.5 w-28 bg-zinc-200 rounded ml-1" />
                </div>
                <div className="h-7 w-24 bg-zinc-900 rounded-lg"/>
              </div>

              {/* Week header */}
              <div className="grid grid-cols-7 gap-1 mb-2 pl-8">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                  <div key={d} className="text-center text-xs text-zinc-400 font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-1 pl-8">
                <div className="w-8 flex-shrink-0 flex flex-col gap-1 -ml-8">
                  {['09', '10', '11', '12', '13', '14'].map((h) => (
                    <div key={h} className="h-10 flex items-start">
                      <span className="text-[10px] text-zinc-300 leading-none pr-1.5">{h}</span>
                    </div>
                  ))}
                </div>
                {[
                  [{ h: 0, span: 1, label: 'María G.', color: 'bg-blue-50 border-blue-200 text-blue-800' }, { h: 3, span: 2, label: 'Carlos R.', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' }],
                  [],
                  [{ h: 1, span: 2, label: 'Ana L.', color: 'bg-green-50 border-green-200 text-green-800' }],
                  [{ h: 0, span: 1, label: 'Juan P.', color: 'bg-blue-50 border-blue-200 text-blue-800' }, { h: 2, span: 1, label: 'Sofía M.', color: 'bg-blue-50 border-blue-200 text-blue-800' }],
                  [{ h: 4, span: 2, label: 'Pedro T.', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' }],
                  [],
                  [],
                ].map((col, ci) => (
                  <div key={ci} className="flex-1 relative" style={{ height: 240 }}>
                    {[0,1,2,3,4,5].map((row) => (
                      <div key={row} className="absolute w-full border-t border-zinc-100" style={{ top: row * 40, height: 40 }} />
                    ))}
                    {col.map((b, bi) => (
                      <div
                        key={bi}
                        className={`absolute inset-x-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium overflow-hidden ${b.color}`}
                        style={{ top: b.h * 40 + 2, height: b.span * 40 - 4 }}
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-100 max-w-5xl mx-auto" />

      {/* Feature grid */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-12">
          Todo lo que necesitás
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden">
          <FeatureCard
            label="Página pública de reservas"
            desc="Cada negocio tiene su propia URL. Tus clientes entran, eligen profesional, servicio y horario, y reservan sin llamarte."
          />
          <FeatureCard
            label="Agenda semanal"
            desc="Vista de calendario por semana. Ves todos los turnos de un vistazo, filtrás por sucursal o profesional, y creás turnos con un clic."
          />
          <FeatureCard
            label="Estados de turno"
            desc="Pendiente, confirmado, completado, cancelado. Cada turno tiene su estado y podés actualizarlo desde el mismo calendario."
          />
          <FeatureCard
            label="Gestión de profesionales"
            desc="Invitá a tu equipo por email. Cada uno tiene su propio acceso, ve su agenda y sus clientes. Vos asignás sucursales y servicios."
          />
          <FeatureCard
            label="Múltiples sucursales"
            desc="¿Tenés más de un local? Gestioná todo desde el mismo panel con horarios independientes por sucursal."
          />
          <FeatureCard
            label="Historial de clientes"
            desc="Cada cliente tiene su propio registro. Sabés cuántas veces vino, cuándo fue la última vez y qué servicios pidió."
          />
          <FeatureCard
            label="Google Calendar"
            desc="Los turnos se sincronizan automáticamente con el calendario de cada profesional. Si cancelás un turno, desaparece solo."
          />
          <FeatureCard
            label="Confirmaciones por email"
            desc="Los clientes reciben un email cuando hacen una reserva. Podés personalizar el asunto y el contenido del mensaje."
          />
          <FeatureCard
            label="Panel de administración"
            desc="Ves los números del día, accedés rápido a todo desde el mismo lugar, sin ruido ni pantallas de más."
          />
        </div>
      </section>

      {/* Two-col callout */}
      <section className="pb-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl px-8 py-10 text-white">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Para el negocio</p>
            <p className="text-lg font-semibold leading-snug mb-3">Un panel, todo bajo control.</p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              El admin ve todos los turnos, todos los profesionales, todas las sucursales.
              Filtrá por lo que necesitás, creá turnos manualmente, gestioná el equipo.
            </p>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-8 py-10">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">Para los profesionales</p>
            <p className="text-lg font-semibold leading-snug mb-3 text-zinc-900">Su agenda, sin acceso a lo demás.</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Cada profesional entra con su propia cuenta, ve solo sus turnos y sus clientes.
              Sin configuraciones, sin distracciones.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16 px-6 max-w-5xl mx-auto">
        <div className="border border-zinc-100 rounded-2xl p-10 sm:p-14 bg-zinc-50">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-12">
            Cómo funciona
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <Step number="01" title="Configurás tu negocio" desc="Cargás tus servicios, sucursales y profesionales. Definís horarios de atención y duraciones de cada servicio." />
            <Step number="02" title="Compartís tu link" desc="Tu página pública queda lista al instante. La ponés en Instagram, WhatsApp, tu sitio web, donde quieras." />
            <Step number="03" title="Llegan los turnos" desc="Tus clientes reservan solos a cualquier hora. Vos los ves en el panel y gestionás todo desde ahí." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          Probalo sin compromisos
        </h2>
        <p className="text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
          Creá tu cuenta, configurá tu negocio en minutos y empezá a recibir turnos hoy.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-zinc-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-zinc-700 transition"
        >
          Empezar gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">reservo</span>
          <Link href="/login" className="text-xs text-zinc-400 hover:text-zinc-700 transition">
            Ingresar
          </Link>
        </div>
      </footer>

    </div>
  )
}

function FeatureCard({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="bg-white px-7 py-8">
      <p className="text-sm font-semibold text-zinc-900 mb-2">{label}</p>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div>
      <p className="text-xs font-mono text-zinc-300 mb-3">{number}</p>
      <p className="text-sm font-semibold text-zinc-900 mb-2">{title}</p>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  )
}
