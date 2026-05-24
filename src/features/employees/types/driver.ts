export type EmployeeDocuments = {
  aadharCardFront?: string
  aadharCardBack?: string
  dlFront?: string
  dlBack?: string
  upiScanner?: string | null
}

export type Driver = {
  id: string
  driverIdNumber: string
  aadharName: string
  dlName: string
  dateOfBirth: string
  mobileNumber: string
  alternateMobile: string | null
  emergencyNumber: string | null
  aadharNumber: string
  dlNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string | null
  dlIssueDate: string
  dlExpiryDate: string
  transportIssueDate: string
  transportValidFrom: string
  transportValidTo: string
  dateOfJoining: string
  dateOfLeaving: string | null
  referenceName: string
  remarks: string | null
  createdAt?: string
  updatedAt?: string
} & EmployeeDocuments

export type DriverFormValues = {
  aadharName: string
  dlName: string
  dateOfBirth: string
  mobileNumber: string
  alternateMobile: string
  emergencyNumber: string
  aadharNumber: string
  dlNumber: string
  accountHolderName: string
  accountNumber: string
  bankName: string
  branchName: string
  ifscCode: string
  upiId: string
  dlIssueDate: string
  dlExpiryDate: string
  transportIssueDate: string
  transportValidFrom: string
  transportValidTo: string
  dateOfJoining: string
  dateOfLeaving: string
  referenceName: string
  remarks: string
  aadharCardFront: string
  aadharCardBack: string
  dlFront: string
  dlBack: string
  upiScanner: string
}

export type CreateDriverInput = Omit<Driver, 'id' | 'driverIdNumber' | 'createdAt' | 'updatedAt'> & {
  dateOfLeaving?: string | null
  upiScanner?: string | null
}

export type UpdateDriverInput = Partial<CreateDriverInput> & { driverId: string }
