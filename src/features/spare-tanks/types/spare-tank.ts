export type SpareTank = {
  id: string
  ownerName: string
  busNumber: string
  busId?: string
  createdAt?: string
  updatedAt?: string
}

export type SpareTankFormValues = {
  busNumber: string
  ownerName: string
}

export type CreateSpareTankInput = {
  busNumber: string
  ownerName: string
}

export type UpdateSpareTankInput = {
  spareTankId: string
  busNumber?: string
  ownerName?: string
}

export type SpareTankGridRow = {
  id: string
  busNumber: string
  ownerName: string
  updatedAt: string
  updatedAtLabel: string
}
