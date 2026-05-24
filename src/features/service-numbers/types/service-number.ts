export type ServiceForRef = {
  id: string
  serviceFor: string
}

export type ServiceNumber = {
  id: string
  serviceNo: string
  from: string
  to: string
  via: string
  parkingAmount: number
  driverOneBeta: number
  driverTwoBeta: number
  helperBeta: number
  conductorBeta: number
  distance: number
  optDriver: string
  optHelper: string
  remarks: string
  serviceFor: ServiceForRef
  createdAt?: string
  updatedAt?: string
}

export type ServiceNumberFormValues = {
  serviceForId: string
  serviceNo: string
  from: string
  to: string
  via: string
  parkingAmount: string
  driverOneBeta: string
  driverTwoBeta: string
  helperBeta: string
  conductorBeta: string
  distance: string
  optDriver: string
  optHelper: string
  remarks: string
}

export type CreateServiceNumberInput = {
  serviceForId: string
  serviceNo: string
  from: string
  to: string
  via: string
  parkingAmount: number
  driverOneBeta: number
  driverTwoBeta: number
  helperBeta: number
  conductorBeta: number
  distance: number
  optDriver: string
  optHelper: string
  remarks: string
}

export type UpdateServiceNumberInput = CreateServiceNumberInput & {
  serviceNumberId: string
}
