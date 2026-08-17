import { apiClient } from '@/lib/api/client'
import {
  extractArrayPayload,
  extractEntityPayload,
  extractPaginationMeta,
  normalizeString,
  resolveEntityId,
} from '@/lib/utils/master-api'
import type { CreateHelperInput, Helper, UpdateHelperInput } from '@/features/employees/types/helper'

const endpoint = '/master/helpers'

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return normalizeString(value) ?? null
}

function normalizeHelper(raw: unknown): Helper | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const id = resolveEntityId(value)
  const helperIdNumber = normalizeString(value.helperIdNumber)
  const aadharName = normalizeString(value.aadharName)
  const nickName = normalizeString(value.nickName)
  const mobileNumber = normalizeString(value.mobileNumber)
  const aadharNumber = normalizeString(value.aadharNumber)
  const reference = normalizeString(value.reference)

  if (!id || !helperIdNumber || !aadharName || !nickName || !mobileNumber || !aadharNumber || !reference) {
    return null
  }

  return {
    id,
    helperIdNumber,
    aadharName,
    nickName,
    dateOfBirth: normalizeString(value.dateOfBirth) ?? '',
    mobileNumber,
    alternateNumber: normalizeNullableString(value.alternateNumber),
    emergencyMobile: normalizeNullableString(value.emergencyMobile),
    aadharNumber,
    accountHolderName: normalizeString(value.accountHolderName) ?? '',
    accountNumber: normalizeString(value.accountNumber) ?? '',
    bankName: normalizeString(value.bankName) ?? '',
    branchName: normalizeString(value.branchName) ?? '',
    ifscCode: normalizeString(value.ifscCode) ?? '',
    upiId: normalizeNullableString(value.upiId),
    dateOfJoining: normalizeString(value.dateOfJoining) ?? '',
    dateOfLeaving: normalizeNullableString(value.dateOfLeaving),
    reference,
    remarks: normalizeNullableString(value.remarks),
    aadharCardFront: normalizeString(value.aadharCardFront),
    aadharCardBack: normalizeString(value.aadharCardBack),
    upiScanner: normalizeNullableString(value.upiScanner) ?? undefined,
    createdAt: normalizeString(value.createdAt),
    updatedAt: normalizeString(value.updatedAt),
  }
}

export const helpersService = {
  /**
   * Loads helpers for the Employees masters page.
   * When `page` is omitted, pages through the API (max limit 100) so helpers
   * beyond the first response are not silently missing from the list.
   */
  async list(params?: { page?: number; limit?: number }): Promise<Helper[]> {
    if (params?.page != null) {
      const page = params.page
      const limit = params.limit ?? 100
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      return extractArrayPayload(data).map(normalizeHelper).filter((item): item is Helper => Boolean(item))
    }

    const limit = Math.min(params?.limit ?? 100, 100)
    const maxPages = 50
    const helpersById = new Map<string, Helper>()

    for (let page = 1; page <= maxPages; page += 1) {
      const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
      const pageHelpers = extractArrayPayload(data)
        .map(normalizeHelper)
        .filter((item): item is Helper => Boolean(item))

      for (const helper of pageHelpers) {
        helpersById.set(helper.id, helper)
      }

      if (pageHelpers.length === 0 || pageHelpers.length < limit) {
        break
      }

      const meta = extractPaginationMeta(data, { page, limit })
      if (meta.hasExplicitTotalPages && page >= meta.totalPages) {
        break
      }
    }

    return Array.from(helpersById.values())
  },

  async getById(helperId: string): Promise<Helper> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${helperId}`)
    const normalized = normalizeHelper(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Unable to load helper details.')
    }
    return normalized
  },

  async create(input: CreateHelperInput): Promise<Helper> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    const normalized = normalizeHelper(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Helper was created but the response could not be parsed.')
    }
    return normalized
  },

  async update({ helperId, ...input }: UpdateHelperInput): Promise<Helper> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${helperId}`, input)
    const normalized = normalizeHelper(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Helper was updated but the response could not be parsed.')
    }
    return normalized
  },

  async remove(helperId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${helperId}`)
  },
}
