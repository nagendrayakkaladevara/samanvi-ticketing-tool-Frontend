export type MasterBus = {
  id: string
  busNumber: string
  engineNumber: string
  chassisNumber: string
  purchaseDate: string | null
  odometer: number
  insuranceValidity: string
  pollutionValidity: string | null
  fcValidity: string | null
  basePermitValidity: string | null
  homeTaxValidity: string | null
  aitpValidity: string | null
  aitpAuthorizationValidity: string | null
  serviceOutDate: string | null
  remarks: string | null
  lastMaintenanceDate: string | null
  createdAt?: string
  updatedAt?: string
}

export type MasterBusFormValues = {
  busNumber: string
  engineNumber: string
  chassisNumber: string
  purchaseDate: string
  odometer: string
  insuranceValidity: string
  pollutionValidity: string
  fcValidity: string
  basePermitValidity: string
  homeTaxValidity: string
  aitpValidity: string
  aitpAuthorizationValidity: string
  serviceOutDate: string
  remarks: string
  lastMaintenanceDate: string
}

export type CreateMasterBusInput = {
  busNumber: string
  engineNumber: string
  chassisNumber: string
  odometer: number
  insuranceValidity: string
  purchaseDate?: string | null
  pollutionValidity?: string | null
  fcValidity?: string | null
  basePermitValidity?: string | null
  homeTaxValidity?: string | null
  aitpValidity?: string | null
  aitpAuthorizationValidity?: string | null
  serviceOutDate?: string | null
  remarks?: string | null
  lastMaintenanceDate?: string | null
}

export type UpdateMasterBusInput = Partial<CreateMasterBusInput> & {
  busId: string
}

export type MasterBusGridRow = {
  id: string
  busNumber: string
  engineNumber: string
  chassisNumber: string
  purchaseDate: string | null
  purchaseDateLabel: string
  odometer: number
  insuranceValidity: string
  insuranceValidityLabel: string
  pollutionValidity: string | null
  pollutionValidityLabel: string
  fcValidity: string | null
  fcValidityLabel: string
  basePermitValidity: string | null
  basePermitValidityLabel: string
  homeTaxValidity: string | null
  homeTaxValidityLabel: string
  aitpValidity: string | null
  aitpValidityLabel: string
  aitpAuthorizationValidity: string | null
  aitpAuthorizationValidityLabel: string
  serviceOutDate: string | null
  serviceOutDateLabel: string
  remarks: string | null
}
