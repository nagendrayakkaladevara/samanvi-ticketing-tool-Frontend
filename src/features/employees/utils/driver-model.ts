import { masterDateToInputValue } from '@/lib/utils/master-dates'
import type { CreateDriverInput, Driver, DriverFormValues } from '@/features/employees/types/driver'
import {
  defaultBankFields,
  defaultDocumentFields,
  defaultEmploymentFields,
  defaultPersonalFields,
  parseOptionalMasterDate,
  parseOptionalMobile,
  parseOptionalText,
  parseRequiredAadhar,
  parseRequiredDocument,
  parseRequiredIfsc,
  parseRequiredMasterDate,
  parseRequiredMobile,
  parseRequiredText,
} from '@/features/employees/utils/employee-model'

export const defaultDriverFormValues: DriverFormValues = {
  aadharName: '',
  dlName: '',
  ...defaultPersonalFields,
  alternateMobile: '',
  emergencyNumber: '',
  dlNumber: '',
  ...defaultBankFields,
  dlIssueDate: '',
  dlExpiryDate: '',
  transportIssueDate: '',
  transportValidFrom: '',
  transportValidTo: '',
  ...defaultEmploymentFields,
  referenceName: '',
  ...defaultDocumentFields,
  dlFront: '',
  dlBack: '',
}

export function driverToFormValues(driver: Driver): DriverFormValues {
  return {
    aadharName: driver.aadharName,
    dlName: driver.dlName,
    dateOfBirth: masterDateToInputValue(driver.dateOfBirth),
    mobileNumber: driver.mobileNumber,
    alternateMobile: driver.alternateMobile ?? '',
    emergencyNumber: driver.emergencyNumber ?? '',
    aadharNumber: driver.aadharNumber,
    dlNumber: driver.dlNumber,
    accountHolderName: driver.accountHolderName,
    accountNumber: driver.accountNumber,
    bankName: driver.bankName,
    branchName: driver.branchName,
    ifscCode: driver.ifscCode,
    upiId: driver.upiId ?? '',
    dlIssueDate: masterDateToInputValue(driver.dlIssueDate),
    dlExpiryDate: masterDateToInputValue(driver.dlExpiryDate),
    transportIssueDate: masterDateToInputValue(driver.transportIssueDate),
    transportValidFrom: masterDateToInputValue(driver.transportValidFrom),
    transportValidTo: masterDateToInputValue(driver.transportValidTo),
    dateOfJoining: masterDateToInputValue(driver.dateOfJoining),
    dateOfLeaving: masterDateToInputValue(driver.dateOfLeaving),
    referenceName: driver.referenceName,
    remarks: driver.remarks ?? '',
    aadharCardFront: driver.aadharCardFront ?? '',
    aadharCardBack: driver.aadharCardBack ?? '',
    dlFront: driver.dlFront ?? '',
    dlBack: driver.dlBack ?? '',
    upiScanner: driver.upiScanner ?? '',
  }
}

export function buildDriverPayload(values: DriverFormValues, mode: 'create' | 'edit'): CreateDriverInput {
  const payload: CreateDriverInput = {
    aadharName: parseRequiredText(values.aadharName, 'Aadhar name', 120),
    dlName: parseRequiredText(values.dlName, 'DL name', 120),
    dateOfBirth: parseRequiredMasterDate(values.dateOfBirth, 'Date of birth'),
    mobileNumber: parseRequiredMobile(values.mobileNumber, 'Mobile number'),
    aadharNumber: parseRequiredAadhar(values.aadharNumber),
    dlNumber: parseRequiredText(values.dlNumber, 'DL number', 30),
    accountHolderName: parseRequiredText(values.accountHolderName, 'Account holder name', 120),
    accountNumber: parseRequiredText(values.accountNumber, 'Account number', 30),
    bankName: parseRequiredText(values.bankName, 'Bank name', 120),
    branchName: parseRequiredText(values.branchName, 'Branch name', 120),
    ifscCode: parseRequiredIfsc(values.ifscCode),
    dlIssueDate: parseRequiredMasterDate(values.dlIssueDate, 'DL issue date'),
    dlExpiryDate: parseRequiredMasterDate(values.dlExpiryDate, 'DL expiry date'),
    transportIssueDate: parseRequiredMasterDate(values.transportIssueDate, 'Transport issue date'),
    transportValidFrom: parseRequiredMasterDate(values.transportValidFrom, 'Transport valid from'),
    transportValidTo: parseRequiredMasterDate(values.transportValidTo, 'Transport valid to'),
    dateOfJoining: parseRequiredMasterDate(values.dateOfJoining, 'Date of joining'),
    referenceName: parseRequiredText(values.referenceName, 'Reference name', 120),
    alternateMobile: null,
    emergencyNumber: null,
    upiId: null,
    dateOfLeaving: null,
    remarks: null,
    upiScanner: null,
  }

  const alternateMobile = parseOptionalMobile(values.alternateMobile, 'Alternate mobile')
  const emergencyNumber = parseOptionalMobile(values.emergencyNumber, 'Emergency number')
  const upiId = parseOptionalText(values.upiId, 120)
  const remarks = parseOptionalText(values.remarks, 500)
  const dateOfLeaving = parseOptionalMasterDate(values.dateOfLeaving)

  if (alternateMobile) payload.alternateMobile = alternateMobile
  if (emergencyNumber) payload.emergencyNumber = emergencyNumber
  if (upiId) payload.upiId = upiId
  if (remarks) payload.remarks = remarks
  if (dateOfLeaving) payload.dateOfLeaving = dateOfLeaving

  if (mode === 'create') {
    payload.aadharCardFront = parseRequiredDocument(values.aadharCardFront, 'Aadhar card front')
    payload.aadharCardBack = parseRequiredDocument(values.aadharCardBack, 'Aadhar card back')
    payload.dlFront = parseRequiredDocument(values.dlFront, 'DL front')
    payload.dlBack = parseRequiredDocument(values.dlBack, 'DL back')
    const upiScanner = values.upiScanner.trim()
    if (upiScanner) payload.upiScanner = upiScanner
  } else {
    if (values.aadharCardFront.trim()) payload.aadharCardFront = values.aadharCardFront.trim()
    if (values.aadharCardBack.trim()) payload.aadharCardBack = values.aadharCardBack.trim()
    if (values.dlFront.trim()) payload.dlFront = values.dlFront.trim()
    if (values.dlBack.trim()) payload.dlBack = values.dlBack.trim()
    if (values.upiScanner.trim()) {
      payload.upiScanner = values.upiScanner.trim()
    }
  }

  return payload
}
