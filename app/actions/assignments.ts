'use server'
import { revalidatePath } from 'next/cache'
import { requireTenantId } from '@/app/lib/dal'
import { prisma } from '@/lib/prisma'

type AssignState = { success?: boolean; error?: string } | undefined

export async function updateProfessionalAssignments(
  state: AssignState,
  formData: FormData
): Promise<AssignState> {
  const { tenantId } = await requireTenantId()
  const professionalId = formData.get('professionalId') as string
  const branchIds = formData.getAll('branchId') as string[]
  const serviceIds = formData.getAll('serviceId') as string[]

  const pro = await prisma.user.findFirst({
    where: { id: professionalId, tenantId, role: 'professional' },
  })
  if (!pro) return { error: 'Profesional no encontrado.' }

  await prisma.user.update({
    where: { id: professionalId },
    data: {
      branches: { set: branchIds.map((id) => ({ id })) },
      services: { set: serviceIds.map((id) => ({ id })) },
    },
  })

  revalidatePath('/dashboard/professionals')
  revalidatePath('/dashboard/branches')
  return { success: true }
}
