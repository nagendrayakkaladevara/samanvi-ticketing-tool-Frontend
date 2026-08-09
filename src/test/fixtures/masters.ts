import type { MasterBus } from '@/features/master-buses/types/master-bus'
import type { ServiceFor } from '@/features/service-for/types/service-for'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import type { SpareTank } from '@/features/spare-tanks/types/spare-tank'

export function makeMasterBus(overrides?: Partial<MasterBus>): MasterBus {
  return {
    id: 'bus-1',
    busNumber: 'BUS-01',
    engineNumber: 'ENG-001',
    chassisNumber: 'CHS-001',
    purchaseDate: '01-01-2020',
    odometer: 50000,
    insuranceValidity: '01-01-2025',
    pollutionValidity: '01-06-2025',
    fcValidity: '01-03-2025',
    basePermitValidity: '01-04-2025',
    homeTaxValidity: '01-05-2025',
    aitpValidity: '01-07-2025',
    aitpAuthorizationValidity: '01-08-2025',
    serviceOutDate: '01-09-2025',
    remarks: 'Test bus',
    lastMaintenanceDate: '01-02-2025',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

export function makeServiceNumber(overrides?: Partial<ServiceNumber>): ServiceNumber {
  return {
    id: 'sn-1',
    serviceNo: '101',
    from: 'City A',
    to: 'City B',
    via: 'Highway',
    parkingAmount: 100,
    driverOneBeta: 50,
    driverTwoBeta: 40,
    helperBeta: 30,
    conductorBeta: 20,
    distance: 120,
    optDriver: 'Driver Opt',
    optHelper: 'Helper Opt',
    remarks: 'Route notes',
    serviceFor: { id: 'sf-1', serviceFor: 'Express' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

export function makeSpareTank(overrides?: Partial<SpareTank>): SpareTank {
  return {
    id: 'st-1',
    busNumber: 'BUS-01',
    ownerName: 'Owner Name',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

export function makeServiceFor(overrides?: Partial<ServiceFor>): ServiceFor {
  return {
    id: 'sf-1',
    serviceFor: 'Express Service',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}
