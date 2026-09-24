import { upload } from '@vercel/blob/client'

import { env } from '@/config/env'
import { apiClient } from '@/lib/api/client'
import { getAccessToken } from '@/store/auth-store'

import type {
  AnnouncementAudio,
  AnnouncementRoute,
  AnnouncementSettings,
  AudioCategory,
  Paginated,
} from './types'

const BASE = '/announcements'

type ApiEnvelope<T> = { success: boolean; data: T }

export const announcementKeys = {
  routes: ['announcements', 'routes'] as const,
  route: (id: string) => ['announcements', 'routes', id] as const,
  audios: ['announcements', 'audios'] as const,
  settings: ['announcements', 'settings'] as const,
}

export async function listRoutes() {
  const response = await apiClient.get<ApiEnvelope<Paginated<AnnouncementRoute>>>(`${BASE}/routes`, {
    params: { page: 1, limit: 100 },
  })
  return response.data.data
}

export async function getRoute(routeId: string) {
  const response = await apiClient.get<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes/${routeId}`)
  return response.data.data
}

export async function createRoute(input: Pick<AnnouncementRoute, 'routeCode' | 'name' | 'origin' | 'destination'>) {
  const response = await apiClient.post<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes`, input)
  return response.data.data
}

export async function updateRoute(
  routeId: string,
  input: Partial<Pick<AnnouncementRoute, 'routeCode' | 'name' | 'origin' | 'destination' | 'status'>> & {
    expectedVersion: number
  },
) {
  const response = await apiClient.patch<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes/${routeId}`, input)
  return response.data.data
}

export async function saveRoutePlaylist(
  routeId: string,
  input: { expectedVersion: number; items: Array<{ audioId: string; stopLabel?: string }> },
) {
  const response = await apiClient.put<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes/${routeId}/audios`, input)
  return response.data.data
}

export async function archiveRoute(routeId: string, expectedVersion: number) {
  await apiClient.delete(`${BASE}/routes/${routeId}`, { data: { expectedVersion } })
}

export async function listAudios() {
  const response = await apiClient.get<ApiEnvelope<Paginated<AnnouncementAudio>>>(`${BASE}/audios`, {
    params: { page: 1, limit: 100 },
  })
  return response.data.data
}

export async function updateAudio(
  audioId: string,
  input: Partial<Pick<AnnouncementAudio, 'title' | 'description' | 'category'>>,
) {
  const response = await apiClient.patch<ApiEnvelope<AnnouncementAudio>>(`${BASE}/audios/${audioId}`, input)
  return response.data.data
}

export async function archiveAudio(audioId: string) {
  await apiClient.delete(`${BASE}/audios/${audioId}`)
}

export async function getSettings() {
  const response = await apiClient.get<ApiEnvelope<AnnouncementSettings>>(`${BASE}/settings`)
  return response.data.data
}

export async function updateSettings(activeWelcomeAudioId: string | null) {
  const response = await apiClient.put<ApiEnvelope<AnnouncementSettings>>(`${BASE}/settings`, {
    activeWelcomeAudioId,
  })
  return response.data.data
}

export async function uploadAudio(input: {
  file: File
  title: string
  description?: string
  category: AudioCategory
  durationMs?: number
  onProgress?: (percentage: number) => void
}) {
  const token = getAccessToken()
  const handleUploadUrl = new URL(`${env.apiBaseUrl.replace(/\/$/, '')}${BASE}/audios/upload`, window.location.origin).toString()
  return upload(input.file.name, input.file, {
    access: 'public',
    handleUploadUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    clientPayload: JSON.stringify({
      title: input.title,
      description: input.description || undefined,
      category: input.category,
      fileName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      durationMs: input.durationMs,
    }),
    onUploadProgress: ({ percentage }) => input.onProgress?.(Math.round(percentage)),
  })
}

