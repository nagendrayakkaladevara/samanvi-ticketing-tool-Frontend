import { masterDateToInputValue } from '@/lib/utils/master-dates'
import type {
  CreateOfficeStaffInput,
  OfficeStaff,
  OfficeStaffFormValues,
} from '@/features/employees/types/office-staff'
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

export const defaultOfficeStaffFormValues: OfficeStaffFormValues = {
  aadharName: '',
  nickName: '',
  designation: '',
  ...defaultPersonalFields,
  alternativeMobile: '',
  emergencyContact: '',
  ...defaultBankFields,
  ...defaultEmploymentFields,
  referenceName: '',
  ...defaultDocumentFields,
}

export function officeStaffToFormValues(staff: OfficeStaff): OfficeStaffFormValues {
  return {
    aadharName: staff.aadharName,
    nickName: staff.nickName,
    designation: staff.designation,
    dateOfBirth: masterDateToInputValue(staff.dateOfBirth),
    mobileNumber: staff.mobileNumber,
    alternativeMobile: staff.alternativeMobile ?? '',
    emergencyContact: staff.emergencyContact ?? '',
    aadharNumber: staff.aadharNumber,
    accountHolderName: staff.accountHolderName,
    accountNumber: staff.accountNumber,
    bankName: staff.bankName,
    branchName: staff.branchName,
    ifscCode: staff.ifscCode,
    upiId: staff.upiId ?? '',
    dateOfJoining: masterDateToInputValue(staff.dateOfJoining),
    dateOfLeaving: masterDateToInputValue(staff.dateOfLeaving),
    referenceName: staff.referenceName,
    remarks: staff.remarks ?? '',
    aadharCardFront: staff.aadharCardFront ?? '',
    aadharCardBack: staff.aadharCardBack ?? '',
    upiScanner: staff.upiScanner ?? '',
  }
}

export function buildOfficeStaffPayload(
  values: OfficeStaffFormValues,
  mode: 'create' | 'edit',
): CreateOfficeStaffInput {
  const payload: CreateOfficeStaffInput = {
    aadharName: parseRequiredText(values.aadharName, 'Full name', 120),
    nickName: parseRequiredText(values.nickName, 'Nick name', 120),
    designation: parseRequiredText(values.designation, 'Designation', 120),
    dateOfBirth: parseRequiredMasterDate(values.dateOfBirth, 'Date of birth'),
    mobileNumber: parseRequiredMobile(values.mobileNumber, 'Mobile number'),
    aadharNumber: parseRequiredAadhar(values.aadharNumber),
    accountHolderName: parseRequiredText(values.accountHolderName, 'Account holder name', 120),
    accountNumber: parseRequiredText(values.accountNumber, 'Account number', 30),
    bankName: parseRequiredText(values.bankName, 'Bank name', 120),
    branchName: parseRequiredText(values.branchName, 'Branch name', 120),
    ifscCode: parseRequiredIfsc(values.ifscCode),
    dateOfJoining: parseRequiredMasterDate(values.dateOfJoining, 'Date of joining'),
    referenceName: parseRequiredText(values.referenceName, 'Reference name', 120),
    alternativeMobile: null,
    emergencyContact: null,
    upiId: null,
    dateOfLeaving: null,
    remarks: null,
    upiScanner: null,
  }

  const alternativeMobile = parseOptionalMobile(values.alternativeMobile, 'Alternative mobile')
  const emergencyContact = parseOptionalMobile(values.emergencyContact, 'Emergency contact')
  const upiId = parseOptionalText(values.upiId, 120)
  const remarks = parseOptionalText(values.remarks, 500)
  const dateOfLeaving = parseOptionalMasterDate(values.dateOfLeaving)

  if (alternativeMobile) payload.alternativeMobile = alternativeMobile
  if (emergencyContact) payload.emergencyContact = emergencyContact
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
