import { formatMasterDateDisplay, masterDateToInputValue } from '@/lib/utils/master-dates'
import type { MasterBus, MasterBusFormValues, MasterBusGridRow } from '@/features/master-buses/types/master-bus'

export const defaultMasterBusFormValues: MasterBusFormValues = {
  busNumber: '',
  engineNumber: '',
  chassisNumber: '',
  purchaseDate: '',
  odometer: '',
  insuranceValidity: '',
  pollutionValidity: '',
  fcValidity: '',
  basePermitValidity: '',
  homeTaxValidity: '',
  aitpValidity: '',
  aitpAuthorizationValidity: '',
  serviceOutDate: '',
  remarks: '',
  lastMaintenanceDate: '',
}

export function masterBusToFormValues(bus: MasterBus): MasterBusFormValues {
  return {
    busNumber: bus.busNumber,
    engineNumber: bus.engineNumber,
    chassisNumber: bus.chassisNumber,
    purchaseDate: masterDateToInputValue(bus.purchaseDate),
    odometer: String(bus.odometer),
    insuranceValidity: masterDateToInputValue(bus.insuranceValidity),
    pollutionValidity: masterDateToInputValue(bus.pollutionValidity),
    fcValidity: masterDateToInputValue(bus.fcValidity),
    basePermitValidity: masterDateToInputValue(bus.basePermitValidity),
    homeTaxValidity: masterDateToInputValue(bus.homeTaxValidity),
    aitpValidity: masterDateToInputValue(bus.aitpValidity),
    aitpAuthorizationValidity: masterDateToInputValue(bus.aitpAuthorizationValidity),
    serviceOutDate: masterDateToInputValue(bus.serviceOutDate),
    remarks: bus.remarks ?? '',
    lastMaintenanceDate: masterDateToInputValue(bus.lastMaintenanceDate),
  }
}

export function toMasterBusGridRow(bus: MasterBus): MasterBusGridRow {
  return {
    id: bus.id,
    busNumber: bus.busNumber,
    engineNumber: bus.engineNumber,
    chassisNumber: bus.chassisNumber,
    purchaseDateLabel: formatMasterDateDisplay(bus.purchaseDate),
    odometer: bus.odometer,
    insuranceValidityLabel: formatMasterDateDisplay(bus.insuranceValidity),
    pollutionValidityLabel: formatMasterDateDisplay(bus.pollutionValidity),
    fcValidityLabel: formatMasterDateDisplay(bus.fcValidity),
    basePermitValidityLabel: formatMasterDateDisplay(bus.basePermitValidity),
    homeTaxValidityLabel: formatMasterDateDisplay(bus.homeTaxValidity),
    aitpValidityLabel: formatMasterDateDisplay(bus.aitpValidity),
    aitpAuthorizationValidityLabel: formatMasterDateDisplay(bus.aitpAuthorizationValidity),
    serviceOutDateLabel: formatMasterDateDisplay(bus.serviceOutDate),
    remarks: bus.remarks,
  }
}

export function compareMasterBusesByNumber(a: MasterBus, b: MasterBus): number {
  return a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true })
}
