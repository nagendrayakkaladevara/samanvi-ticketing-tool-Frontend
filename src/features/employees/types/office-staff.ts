import type { EmployeeDocuments } from '@/features/employees/types/driver'

export type OfficeStaff = {
  id: string
  staffIdNumber: string
  aadharName: string
  nickName: string
  designation: string
  dateOfBirth: string
  mobileNumber: string
  alternativeMobile: string | null
  emergencyContact: string | null
  aadharNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string | null
  dateOfJoining: string
  dateOfLeaving: string | null
  referenceName: string
  remarks: string | null
  createdAt?: string
  updatedAt?: string
} & Pick<EmployeeDocuments, 'aadharCardFront' | 'aadharCardBack' | 'upiScanner'>

export type OfficeStaffFormValues = {
  aadharName: string
  nickName: string
  designation: string
  dateOfBirth: string
  mobileNumber: string
  alternativeMobile: string
  emergencyContact: string
  aadharNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string
  dateOfJoining: string
  dateOfLeaving: string
  referenceName: string
  remarks: string
  aadharCardFront: string
  aadharCardBack: string
  upiScanner: string
}

export type CreateOfficeStaffInput = Omit<OfficeStaff, 'id' | 'staffIdNumber' | 'createdAt' | 'updatedAt'> & {
  dateOfLeaving?: string | null
  upiScanner?: string | null
}

export type UpdateOfficeStaffInput = Partial<CreateOfficeStaffInput> & { staffId: string }
