export type ServiceFor = {
  id: string
  serviceFor: string
  createdAt?: string
  updatedAt?: string
}

export type CreateServiceForInput = {
  serviceFor: string
}

export type UpdateServiceForInput = {
  serviceForId: string
  serviceFor: string
}
