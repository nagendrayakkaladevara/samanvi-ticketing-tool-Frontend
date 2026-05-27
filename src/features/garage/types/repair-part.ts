export type RepairPart = {
  id: string
  partName: string
  price: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type CreateRepairPartInput = {
  partName: string
  price: number
  description?: string
}

export type UpdateRepairPartInput = {
  partId: string
  partName?: string
  price?: number
  description?: string | null
}

export type RepairPartFormValues = {
  partName: string
  price: string
  description: string
}
