export type BookingService = {
  id: string
  name: string
  description: string | null
  price: number | null
  imageUrl: string | null
  duration: number
}

export type BookingItem = {
  id: string
  clientName: string
  clientPhone: string | null
  serviceName: string | null
  startTime: string
  endTime: string
  status: string
  professionalId: string | null
}
