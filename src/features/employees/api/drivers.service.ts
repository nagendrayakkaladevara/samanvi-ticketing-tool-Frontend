import { apiClient } from '@/lib/api/client'
import {
  extractArrayPayload,
  extractEntityPayload,
  normalizeString,
  resolveEntityId,
} from '@/lib/utils/master-api'
import type { CreateDriverInput, Driver, UpdateDriverInput } from '@/features/employees/types/driver'

const endpoint = '/master/drivers'

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return normalizeString(value) ?? null
}

function normalizeDriver(raw: unknown): Driver | null {
  if (!raw || typeof raw !== 'object') return null

  const value = raw as Record<string, unknown>
  const id = resolveEntityId(value)
  const driverIdNumber = normalizeString(value.driverIdNumber)
  const aadharName = normalizeString(value.aadharName)
  const dlName = normalizeString(value.dlName)
  const mobileNumber = normalizeString(value.mobileNumber)
  const aadharNumber = normalizeString(value.aadharNumber)
  const dlNumber = normalizeString(value.dlNumber)

  if (!id || !driverIdNumber || !aadharName || !dlName || !mobileNumber || !aadharNumber || !dlNumber) {
    return null
  }

  return {
    id,
    driverIdNumber,
    aadharName,
    dlName,
    dateOfBirth: normalizeString(value.dateOfBirth) ?? '',
    mobileNumber,
    alternateMobile: normalizeNullableString(value.alternateMobile),
    emergencyNumber: normalizeNullableString(value.emergencyNumber),
    aadharNumber,
    dlNumber,
    accountHolderName: normalizeString(value.accountHolderName) ?? '',
    accountNumber: normalizeString(value.accountNumber) ?? '',
    bankName: normalizeString(value.bankName) ?? '',
    branchName: normalizeString(value.branchName) ?? '',
    ifscCode: normalizeString(value.ifscCode) ?? '',
    upiId: normalizeNullableString(value.upiId),
    dlIssueDate: normalizeString(value.dlIssueDate) ?? '',
    dlExpiryDate: normalizeString(value.dlExpiryDate) ?? '',
    transportIssueDate: normalizeString(value.transportIssueDate) ?? '',
    transportValidFrom: normalizeString(value.transportValidFrom) ?? '',
    transportValidTo: normalizeString(value.transportValidTo) ?? '',
    dateOfJoining: normalizeString(value.dateOfJoining) ?? '',
    dateOfLeaving: normalizeNullableString(value.dateOfLeaving),
    referenceName: normalizeString(value.referenceName) ?? '',
    remarks: normalizeNullableString(value.remarks),
    aadharCardFront: normalizeString(value.aadharCardFront),
    aadharCardBack: normalizeString(value.aadharCardBack),
    dlFront: normalizeString(value.dlFront),
    dlBack: normalizeString(value.dlBack),
    upiScanner: normalizeNullableString(value.upiScanner) ?? undefined,
    createdAt: normalizeString(value.createdAt),
    updatedAt: normalizeString(value.updatedAt),
  }
}

export const driversService = {
  async list(params?: { page?: number; limit?: number }): Promise<Driver[]> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 100
    const { data } = await apiClient.get<unknown>(endpoint, { params: { page, limit } })
    return extractArrayPayload(data).map(normalizeDriver).filter((item): item is Driver => Boolean(item))
  },

  async getById(driverId: string): Promise<Driver> {
    const { data } = await apiClient.get<unknown>(`${endpoint}/${driverId}`)
    const normalized = normalizeDriver(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Unable to load driver details.')
    }
    return normalized
  },

  async create(input: CreateDriverInput): Promise<Driver> {
    const { data } = await apiClient.post<unknown>(endpoint, input)
    const normalized = normalizeDriver(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Driver was created but the response could not be parsed.')
    }
    return normalized
  },

  async update({ driverId, ...input }: UpdateDriverInput): Promise<Driver> {
    const { data } = await apiClient.patch<unknown>(`${endpoint}/${driverId}`, input)
    const normalized = normalizeDriver(extractEntityPayload(data))
    if (!normalized) {
      throw new Error('Driver was updated but the response could not be parsed.')
    }
    return normalized
  },

  async remove(driverId: string): Promise<void> {
    await apiClient.delete(`${endpoint}/${driverId}`)
  },
}
