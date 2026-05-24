import type { EmployeeDocuments } from '@/features/employees/types/driver'

export type Helper = {
  id: string
  helperIdNumber: string
  aadharName: string
  nickName: string
  dateOfBirth: string
  mobileNumber: string
  alternateNumber: string | null
  emergencyMobile: string | null
  aadharNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string | null
  dateOfJoining: string
  dateOfLeaving: string | null
  reference: string
  remarks: string | null
  createdAt?: string
  updatedAt?: string
} & Pick<EmployeeDocuments, 'aadharCardFront' | 'aadharCardBack' | 'upiScanner'>

export type HelperFormValues = {
  aadharName: string
  nickName: string
  dateOfBirth: string
  mobileNumber: string
  alternateNumber: string
  emergencyMobile: string
  aadharNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string
  dateOfJoining: string
  dateOfLeaving: string
  reference: string
  remarks: string
  aadharCardFront: string
  aadharCardBack: string
  upiScanner: string
}

export type CreateHelperInput = Omit<Helper, 'id' | 'helperIdNumber' | 'createdAt' | 'updatedAt'> & {
  dateOfLeaving?: string | null
  upiScanner?: string | null
}

export type UpdateHelperInput = Partial<CreateHelperInput> & { helperId: string }
