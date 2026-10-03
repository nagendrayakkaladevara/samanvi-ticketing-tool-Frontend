import { apiClient } from '@/lib/api/client'

export type MobileDriverUser = {
  id: string
  username: string
  displayName: string
  driverId: string | null
  isActive: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  driver: {
    id: string
    driverIdNumber: string
    aadharName: string
    mobileNumber: string
  } | null
  device: {
    platform: string | null
    deviceName: string | null
    osVersion: string | null
    appVersion: string | null
    registeredAt: string
    lastSeenAt: string
  } | null
}

type Envelope<T> = { success: true; data: T }

export const mobileUserKeys = {
  all: ['announcements', 'mobile-users'] as const,
}

export async function listMobileUsers(search = '') {
  const response = await apiClient.get<Envelope<{ items: MobileDriverUser[] }>>('/announcements/mobile-users', {
    params: { search: search || undefined, status: 'all', limit: 100 },
  })
  return response.data.data.items
}

export async function createMobileUser(input: {
  username: string
  password: string
  displayName: string
}) {
  const response = await apiClient.post<Envelope<MobileDriverUser>>('/announcements/mobile-users', input)
  return response.data.data
}

export async function updateMobileUser(
  id: string,
  input: { username?: string; displayName?: string; password?: string },
) {
  const response = await apiClient.patch<Envelope<MobileDriverUser>>(`/announcements/mobile-users/${id}`, input)
  return response.data.data
}

export async function setMobileUserStatus(id: string, isActive: boolean, reason: string) {
  const response = await apiClient.patch<Envelope<MobileDriverUser>>(`/announcements/mobile-users/${id}/status`, {
    isActive,
    reason,
  })
  return response.data.data
}

export async function resetMobileUserDevice(id: string, reason: string) {
  await apiClient.post(`/announcements/mobile-users/${id}/reset-device`, { reason })
}

export async function deleteMobileUser(id: string, reason: string) {
  await apiClient.delete(`/announcements/mobile-users/${id}`, { data: { reason } })
}
