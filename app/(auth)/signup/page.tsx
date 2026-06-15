'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { FormState } from '@/app/lib/definitions'

const PASSWORD_RULES = [
  'Al menos 8 caracteres',
  'Al menos una letra',
  'Al menos un número',
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

type Step1Data = {
  name: string
  slug: string
  phone: string
  description: string
}

export default function RegistroPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<Step1Data>({ name: '', slug: '', phone: '', description: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [serverState, setServerState] = useState<FormState>(undefined)
  const [isPending, startTransition] = useTransition()
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setStep1(prev => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true)
    setStep1(prev => ({ ...prev, slug: e.target.value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleStep1Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStep(2)
  }

  function handleStep2Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData()
    fd.set('tenantName', step1.name)
    fd.set('tenantSlug', step1.slug)
    fd.set('tenantPhone', step1.phone)
    fd.set('tenantDescription', step1.description)
    if (logoFile) fd.set('logo', logoFile)
    fd.set('email', (form.elements.namedItem('email') as HTMLInputElement).value)
    fd.set('password', (form.elements.namedItem('password') as HTMLInputElement).value)

    startTransition(async () => {
      const result = await signup(undefined, fd)
      if (result) {
        setServerState(result)
        // If errors are on step 1 fields, go back
        if (result.errors?.tenantName || result.errors?.tenantSlug) {
          setStep(1)
        }
      }
    })
  }

  const step1Errors = serverState?.errors && step === 1 ? serverState.errors : undefined
  const step2Errors = serverState?.errors && step === 2 ? serverState.errors : undefined

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Tu negocio</h1>
            <p className="text-sm text-zinc-500 mb-6">Paso 1 de 2 — Configurá tu espacio en Reservo</p>

            <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
              {/* Logo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Logo</label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="cursor-pointer flex items-center gap-4 rounded-xl border-2 border-dashed border-zinc-200 px-4 py-4 hover:border-zinc-400 transition"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                    </p>
                    <p className="text-xs text-zinc-400">PNG, JPG o SVG · opcional</p>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label htmlFor="tenantName" className="text-sm font-medium text-zinc-700">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  required
                  placeholder="Ej: Clínica San Martín"
                  value={step1.name}
                  onChange={handleNameChange}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
                {step1Errors?.tenantName && (
                  <p className="text-xs text-red-600">{step1Errors.tenantName[0]}</p>
                )}
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1">
                <label htmlFor="tenantSlug" className="text-sm font-medium text-zinc-700">
                  URL pública <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-transparent transition">
                  <span className="px-3 py-2 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-300 select-none whitespace-nowrap">
                    reservo.app/
                  </span>
                  <input
                    id="tenantSlug"
                    name="tenantSlug"
                    type="text"
                    required
                    placeholder="mi-negocio"
                    value={step1.slug}
                    onChange={handleSlugChange}
                    className="flex-1 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                </div>
                {step1Errors?.tenantSlug && (
                  <p className="text-xs text-red-600">{step1Errors.tenantSlug[0]}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1">
                <label htmlFor="tenantPhone" className="text-sm font-medium text-zinc-700">
                  Teléfono de contacto
                </label>
                <input
                  id="tenantPhone"
                  name="tenantPhone"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={step1.phone}
                  onChange={e => setStep1(p => ({ ...p, phone: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <label htmlFor="tenantDescription" className="text-sm font-medium text-zinc-700">
                  Descripción
                </label>
                <textarea
                  id="tenantDescription"
                  name="tenantDescription"
                  rows={2}
                  placeholder="Contá brevemente a qué se dedica tu negocio"
                  value={step1.description}
                  onChange={e => setStep1(p => ({ ...p, description: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 cursor-pointer transition"
              >
                Continuar
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Tu cuenta</h1>
            <p className="text-sm text-zinc-500 mb-6">Paso 2 de 2 — Creá el acceso de administrador</p>

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@email.com"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                />
                {step2Errors?.email && (
                  <p className="text-xs text-red-600">{step2Errors.email[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600 cursor-pointer transition"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <ul className="flex flex-col gap-0.5 mt-1">
                  {PASSWORD_RULES.map(rule => (
                    <li key={rule} className="text-xs text-zinc-400 flex items-center gap-1">
                      <span>·</span> {rule}
                    </li>
                  ))}
                </ul>
                {step2Errors?.password && (
                  <ul className="flex flex-col gap-0.5 mt-1">
                    {step2Errors.password.map(e => (
                      <li key={e} className="text-xs text-red-600">{e}</li>
                    ))}
                  </ul>
                )}
              </div>

              {serverState?.message && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {serverState.message}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer transition"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
