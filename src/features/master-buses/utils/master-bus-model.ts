import { formatMasterDateDisplay, inputValueToMasterDate, masterDateToInputValue } from '@/lib/utils/master-dates'
import type {
  CreateMasterBusInput,
  MasterBus,
  MasterBusFormValues,
  MasterBusGridRow,
} from '@/features/master-buses/types/master-bus'

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

type MasterBusFormMode = 'create' | 'edit'

type OptionalMasterBusField =
  | 'purchaseDate'
  | 'pollutionValidity'
  | 'fcValidity'
  | 'basePermitValidity'
  | 'homeTaxValidity'
  | 'aitpValidity'
  | 'aitpAuthorizationValidity'
  | 'serviceOutDate'
  | 'lastMaintenanceDate'
  | 'remarks'

/**
 * On create, omit empty optionals. On edit, send null so PATCH clears stored values
 * (omitting a field leaves the previous value unchanged).
 */
function assignOptionalMasterBusField(
  payload: CreateMasterBusInput,
  key: OptionalMasterBusField,
  value: string | null | undefined,
  mode: MasterBusFormMode,
) {
  if (value) {
    payload[key] = value
    return
  }
  if (mode === 'edit') {
    payload[key] = null
  }
}

export type BuildMasterBusPayloadResult =
  | { ok: true; payload: CreateMasterBusInput }
  | { ok: false; error: string }

export function buildMasterBusPayload(
  values: MasterBusFormValues,
  mode: MasterBusFormMode,
): BuildMasterBusPayloadResult {
  const busNumber = values.busNumber.trim()
  const engineNumber = values.engineNumber.trim()
  const chassisNumber = values.chassisNumber.trim()
  const odometerRaw = values.odometer.trim()
  const insuranceValidity = inputValueToMasterDate(values.insuranceValidity)

  if (mode === 'create') {
    if (!busNumber) {
      return { ok: false, error: 'Bus number is required.' }
    }
    if (!engineNumber) {
      return { ok: false, error: 'Engine number is required.' }
    }
    if (!chassisNumber) {
      return { ok: false, error: 'Chassis number is required.' }
    }
    if (!odometerRaw) {
      return { ok: false, error: 'Odometer reading is required.' }
    }
    const odometer = Number(odometerRaw)
    if (!Number.isInteger(odometer) || odometer < 0) {
      return { ok: false, error: 'Odometer must be a whole number greater than or equal to 0.' }
    }
    if (!insuranceValidity) {
      return { ok: false, error: 'Insurance validity date is required.' }
    }
  }

  const payload: CreateMasterBusInput = {
    busNumber,
    engineNumber,
    chassisNumber,
    odometer: Number(odometerRaw),
    insuranceValidity: insuranceValidity ?? '',
  }

  assignOptionalMasterBusField(payload, 'purchaseDate', inputValueToMasterDate(values.purchaseDate), mode)
  assignOptionalMasterBusField(
    payload,
    'pollutionValidity',
    inputValueToMasterDate(values.pollutionValidity),
    mode,
  )
  assignOptionalMasterBusField(payload, 'fcValidity', inputValueToMasterDate(values.fcValidity), mode)
  assignOptionalMasterBusField(
    payload,
    'basePermitValidity',
    inputValueToMasterDate(values.basePermitValidity),
    mode,
  )
  assignOptionalMasterBusField(
    payload,
    'homeTaxValidity',
    inputValueToMasterDate(values.homeTaxValidity),
    mode,
  )
  assignOptionalMasterBusField(payload, 'aitpValidity', inputValueToMasterDate(values.aitpValidity), mode)
  assignOptionalMasterBusField(
    payload,
    'aitpAuthorizationValidity',
    inputValueToMasterDate(values.aitpAuthorizationValidity),
    mode,
  )
  assignOptionalMasterBusField(
    payload,
    'serviceOutDate',
    inputValueToMasterDate(values.serviceOutDate),
    mode,
  )
  assignOptionalMasterBusField(
    payload,
    'lastMaintenanceDate',
    inputValueToMasterDate(values.lastMaintenanceDate),
    mode,
  )
  assignOptionalMasterBusField(payload, 'remarks', values.remarks.trim() || null, mode)

  if (mode === 'edit' && !insuranceValidity) {
    delete (payload as Partial<CreateMasterBusInput>).insuranceValidity
  }

  return { ok: true, payload }
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
    purchaseDate: bus.purchaseDate,
    purchaseDateLabel: formatMasterDateDisplay(bus.purchaseDate),
    odometer: bus.odometer,
    insuranceValidity: bus.insuranceValidity,
    insuranceValidityLabel: formatMasterDateDisplay(bus.insuranceValidity),
    pollutionValidity: bus.pollutionValidity,
    pollutionValidityLabel: formatMasterDateDisplay(bus.pollutionValidity),
    fcValidity: bus.fcValidity,
    fcValidityLabel: formatMasterDateDisplay(bus.fcValidity),
    basePermitValidity: bus.basePermitValidity,
    basePermitValidityLabel: formatMasterDateDisplay(bus.basePermitValidity),
    homeTaxValidity: bus.homeTaxValidity,
    homeTaxValidityLabel: formatMasterDateDisplay(bus.homeTaxValidity),
    aitpValidity: bus.aitpValidity,
    aitpValidityLabel: formatMasterDateDisplay(bus.aitpValidity),
    aitpAuthorizationValidity: bus.aitpAuthorizationValidity,
    aitpAuthorizationValidityLabel: formatMasterDateDisplay(bus.aitpAuthorizationValidity),
    serviceOutDate: bus.serviceOutDate,
    serviceOutDateLabel: formatMasterDateDisplay(bus.serviceOutDate),
    remarks: bus.remarks,
  }
}

export function compareMasterBusesByNumber(a: MasterBus, b: MasterBus): number {
  return a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true })
}
