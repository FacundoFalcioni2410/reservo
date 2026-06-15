import { z } from 'zod'

export const TenantSignupSchema = z.object({
  tenantName: z.string().min(2, { error: 'El nombre debe tener al menos 2 caracteres.' }).trim(),
  tenantSlug: z
    .string()
    .min(2, { error: 'El slug debe tener al menos 2 caracteres.' })
    .regex(/^[a-z0-9-]+$/, { error: 'Solo letras minúsculas, números y guiones.' })
    .trim(),
  tenantPhone: z.string().optional(),
  tenantDescription: z.string().optional(),
  email: z.email({ error: 'Ingresá un email válido.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres.' })
    .regex(/[a-zA-Z]/, { error: 'Debe contener al menos una letra.' })
    .regex(/[0-9]/, { error: 'Debe contener al menos un número.' })
    .trim(),
})

export const LoginSchema = z.object({
  email: z.email({ error: 'Ingresá un email válido.' }).trim(),
  password: z.string().min(1, { error: 'Ingresá tu contraseña.' }).trim(),
})

export type FormState =
  | {
      errors?: {
        tenantName?: string[]
        tenantSlug?: string[]
        tenantPhone?: string[]
        tenantDescription?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type SessionPayload = {
  userId: string
  role: string
  tenantId?: string
  expiresAt: Date
}
