import { masterDateToInputValue } from '@/lib/utils/master-dates'
import type { CreateHelperInput, Helper, HelperFormValues } from '@/features/employees/types/helper'
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

export const defaultHelperFormValues: HelperFormValues = {
  aadharName: '',
  nickName: '',
  ...defaultPersonalFields,
  alternateNumber: '',
  emergencyMobile: '',
  ...defaultBankFields,
  ...defaultEmploymentFields,
  reference: '',
  ...defaultDocumentFields,
}

export function helperToFormValues(helper: Helper): HelperFormValues {
  return {
    aadharName: helper.aadharName,
    nickName: helper.nickName,
    dateOfBirth: masterDateToInputValue(helper.dateOfBirth),
    mobileNumber: helper.mobileNumber,
    alternateNumber: helper.alternateNumber ?? '',
    emergencyMobile: helper.emergencyMobile ?? '',
    aadharNumber: helper.aadharNumber,
    accountHolderName: helper.accountHolderName,
    accountNumber: helper.accountNumber,
    bankName: helper.bankName,
    branchName: helper.branchName,
    ifscCode: helper.ifscCode,
    upiId: helper.upiId ?? '',
    dateOfJoining: masterDateToInputValue(helper.dateOfJoining),
    dateOfLeaving: masterDateToInputValue(helper.dateOfLeaving),
    reference: helper.reference,
    remarks: helper.remarks ?? '',
    aadharCardFront: helper.aadharCardFront ?? '',
    aadharCardBack: helper.aadharCardBack ?? '',
    upiScanner: helper.upiScanner ?? '',
  }
}

export function buildHelperPayload(values: HelperFormValues, mode: 'create' | 'edit'): CreateHelperInput {
  const payload: CreateHelperInput = {
    aadharName: parseRequiredText(values.aadharName, 'Aadhar name', 120),
    nickName: parseRequiredText(values.nickName, 'Nick name', 120),
    dateOfBirth: parseRequiredMasterDate(values.dateOfBirth, 'Date of birth'),
    mobileNumber: parseRequiredMobile(values.mobileNumber, 'Mobile number'),
    aadharNumber: parseRequiredAadhar(values.aadharNumber),
    accountHolderName: parseRequiredText(values.accountHolderName, 'Account holder name', 120),
    accountNumber: parseRequiredText(values.accountNumber, 'Account number', 30),
    bankName: parseRequiredText(values.bankName, 'Bank name', 120),
    branchName: parseRequiredText(values.branchName, 'Branch name', 120),
    ifscCode: parseRequiredIfsc(values.ifscCode),
    dateOfJoining: parseRequiredMasterDate(values.dateOfJoining, 'Date of joining'),
    reference: parseRequiredText(values.reference, 'Reference', 120),
    alternateNumber: null,
    emergencyMobile: null,
    upiId: null,
    dateOfLeaving: null,
    remarks: null,
    upiScanner: null,
  }

  const alternateNumber = parseOptionalMobile(values.alternateNumber, 'Alternate number')
  const emergencyMobile = parseOptionalMobile(values.emergencyMobile, 'Emergency mobile')
  const upiId = parseOptionalText(values.upiId, 120)
  const remarks = parseOptionalText(values.remarks, 500)
  const dateOfLeaving = parseOptionalMasterDate(values.dateOfLeaving)

  if (alternateNumber) payload.alternateNumber = alternateNumber
  if (emergencyMobile) payload.emergencyMobile = emergencyMobile
  if (upiId) payload.upiId = upiId
  if (remarks) payload.remarks = remarks
  if (dateOfLeaving) payload.dateOfLeaving = dateOfLeaving

  if (mode === 'create') {
    payload.aadharCardFront = parseRequiredDocument(values.aadharCardFront, 'Aadhar card front')
    payload.aadharCardBack = parseRequiredDocument(values.aadharCardBack, 'Aadhar card back')
    const upiScanner = values.upiScanner.trim()
    if (upiScanner) payload.upiScanner = upiScanner
  } else {
    if (values.aadharCardFront.trim()) payload.aadharCardFront = values.aadharCardFront.trim()
    if (values.aadharCardBack.trim()) payload.aadharCardBack = values.aadharCardBack.trim()
    if (values.upiScanner.trim()) payload.upiScanner = values.upiScanner.trim()
  }

  return payload
}
