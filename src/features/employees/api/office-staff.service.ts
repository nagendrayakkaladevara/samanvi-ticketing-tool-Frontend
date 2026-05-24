import { apiClient } from '@/lib/api/client'
import {
  extractArrayPayload,
  extractEntityPayload,
  normalizeString,
  resolveEntityId,
} from '@/lib/utils/master-api'
import type {
  CreateOfficeStaffInput,
  OfficeStaff,
  UpdateOfficeStaffInput,
} from '@/features/employees/types/office-staff'

const endpoint = '/master/office-staff'

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return normalizeString(value) ?? null
}

function normalizeOfficeStaff(raw: unknown): OfficeStaff | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const id = resolveEntityId(value)
  const staffIdNumber = normalizeString(value.staffIdNumber)
  const aadharName = normalizeString(value.aadharName)
  const nickName = normalizeString(value.nickName)
  const designation = normalizeString(value.designation)
  const mobileNumber = normalizeString(value.mobileNumber)
  const aadharNumber = normalizeString(value.aadharNumber)
  const referenceName = normalizeString(value.referenceName)

  if (
    !id ||
    !staffIdNumber ||
    !aadharName ||
    !nickName ||
    !designation ||
    !mobileNumber ||
    !aadharNumber ||
    !referenceName
  ) {
    return null
  }

  return {
    id,
    staffIdNumber,
    aadharName,
    nickName,
    designation,
    dateOfBirth: normalizeString(value.dateOfBirth) ?? '',
    mobileNumber,
    alternativeMobile: normalizeNullableString(value.alternativeMobile),
    emergencyContact: normalizeNullableString(value.emergencyContact),
    aadharNumber,
    accountHolderName: normalizeString(value.accountHolderName) ?? '',
    accountNumber: normalizeString(value.accountNumber) ?? '',
    bankName: normalizeString(value.bankName) ?? '',
    branchName: normalizeString(value.branchName) ?? '',
    ifscCode: normalizeString(value.ifscCode) ?? '',
    upiId: normalizeNullableString(value.upiId),
    dateOfJoining: normalizeString(value.dateOfJoining) ?? '',
    dateOfLeaving: normalizeNullableString(value.dateOfLeaving),
    referenceName,
    remarks: normalizeNullableString(value.remarks),
    aadharCardFront: normalizeString(value.aadharCardFront),
    aadharCardBack: normalizeString(value.aadharCardBack),
    upiScanner: normalizeNullableString(value.upiScanner) ?? undefined,
    createdAt: normalizeString(value.createdAt),
    updatedAt: normalizeString(value.updatedAt),
  }
}

export const officeStaffService = {
  async list(params?: { page?: number; limit?: number }): Promise<OfficeStaff[]> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 100
    const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
    return extractArrayPayload(data).map(normalizeOfficeStaff).filter((item): item is OfficeStaff => Boolean(item))
  },

  async getById(staffId: string): Promise<OfficeStaff> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${staffId}`)
    const normalized = normalizeOfficeStaff(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Unable to load office staff details.')
    }
    return normalized
  },

  async create(input: CreateOfficeStaffInput): Promise<OfficeStaff> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    const normalized = normalizeOfficeStaff(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Office staff member was created but the response could not be parsed.')
    }
    return normalized
  },

  async update({ staffId, ...input }: UpdateOfficeStaffInput): Promise<OfficeStaff> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${staffId}`, input)
    const normalized = normalizeOfficeStaff(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Office staff member was updated but the response could not be parsed.')
    }
    return normalized
  },

  async remove(staffId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${staffId}`)
  },
}
