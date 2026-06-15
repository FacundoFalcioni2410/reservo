'use server'
import { redirect } from 'next/navigation'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { TenantSignupSchema, LoginSchema, FormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  const parsed = TenantSignupSchema.safeParse({
    tenantName: formData.get('tenantName'),
    tenantSlug: formData.get('tenantSlug'),
    tenantPhone: formData.get('tenantPhone') || undefined,
    tenantDescription: formData.get('tenantDescription') || undefined,
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { tenantName, tenantSlug, tenantPhone, tenantDescription, email, password } = parsed.data

  const existingSlug = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (existingSlug) {
    return { errors: { tenantSlug: ['Ese slug ya está en uso. Elegí otro nombre de URL.'] } }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { errors: { email: ['Ya existe una cuenta con ese email.'] } }
  }

  let logoUrl: string | null = null
  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = logoFile.name.split('.').pop() ?? 'png'
    const filename = `${tenantSlug}-${Date.now()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'tenants')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)
    logoUrl = `/uploads/tenants/${filename}`
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [tenant, user] = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: tenantName, slug: tenantSlug, phone: tenantPhone, description: tenantDescription, logoUrl },
    })
    const user = await tx.user.create({
      data: { email, passwordHash, role: 'admin', tenantId: tenant.id },
    })
    return [tenant, user] as const
  })

  await createSession(user.id, user.role, tenant.id)
  redirect('/dashboard')
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { message: 'Email o contraseña incorrectos.' }
  }

  if (!user.passwordHash) {
    return { message: 'Aún no configuraste tu contraseña. Revisá tu email con el link de invitación.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { message: 'Email o contraseña incorrectos.' }
  }

  await createSession(user.id, user.role, user.tenantId ?? undefined)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
