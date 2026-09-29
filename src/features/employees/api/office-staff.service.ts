import { apiClient } from '@/lib/api/client'
import {
  extractArrayPayload,
  extractEntityPayload,
  extractPaginationMeta,
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
  /**
   * Loads office staff for masters + garage job forms.
   * When `page` is omitted, pages through the API (max limit 100) so assignees
   * beyond the first response are not silently missing from Create/Edit Job.
   */
  async list(params?: { page?: number; limit?: number }): Promise<OfficeStaff[]> {
    if (params?.page != null) {
      const page = params.page
      const limit = params.limit ?? 100
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      return extractArrayPayload(data)
        .map(normalizeOfficeStaff)
        .filter((item): item is OfficeStaff => Boolean(item))
    }

    const limit = Math.min(params?.limit ?? 100, 100)
    const maxPages = 50
    const staffById = new Map<string, OfficeStaff>()

    for (let page = 1; page <= maxPages; page += 1) {
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      const pageStaff = extractArrayPayload(data)
        .map(normalizeOfficeStaff)
        .filter((item): item is OfficeStaff => Boolean(item))

      for (const staff of pageStaff) {
        staffById.set(staff.id, staff)
      }

      if (pageStaff.length === 0 || pageStaff.length < limit) {
        break
      }

      const meta = extractPaginationMeta(data, { page, limit })
      if (meta.hasExplicitTotalPages && page >= meta.totalPages) {
        break
      }
    }

    return Array.from(staffById.values())
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
