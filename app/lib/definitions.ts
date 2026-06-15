import { z } from 'zod'

export const SignupSchema = z.object({
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
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type SessionPayload = {
  userId: string
  role: string
  expiresAt: Date
}
