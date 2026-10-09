import axios from 'axios'

import { apiClient } from '@/lib/api/client'

import type {
  AnnouncementAudio,
  AnnouncementRoute,
  AnnouncementSettings,
  AudioCategory,
  AudioStatus,
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
    params: { page: 1, pageSize: 100 },
  })
  return response.data.data
}

export async function getRoute(routeId: string) {
  const response = await apiClient.get<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes/${routeId}`)
  return response.data.data
}

export async function createRoute(input: Pick<AnnouncementRoute, 'routeCode' | 'name' | 'origin' | 'destination' | 'via' | 'busType'>) {
  const response = await apiClient.post<ApiEnvelope<AnnouncementRoute>>(`${BASE}/routes`, input)
  return response.data.data
}

export async function updateRoute(
  routeId: string,
  input: Partial<Pick<AnnouncementRoute, 'routeCode' | 'name' | 'origin' | 'destination' | 'via' | 'busType' | 'status'>> & {
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

export async function listAudios(input: { page?: number; status?: AudioStatus; search?: string; category?: AudioCategory } = {}) {
  const response = await apiClient.get<ApiEnvelope<Paginated<AnnouncementAudio>>>(`${BASE}/audios`, {
    params: { page: 1, pageSize: 100, ...input },
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

export async function deleteAudio(audioId: string) {
  await apiClient.delete(`${BASE}/audios/${audioId}`)
}

export async function restoreAudio(audioId: string) {
  const response = await apiClient.post<ApiEnvelope<AnnouncementAudio>>(`${BASE}/audios/${audioId}/restore`)
  return response.data.data
}

export async function getSettings() {
  const response = await apiClient.get<ApiEnvelope<AnnouncementSettings>>(`${BASE}/settings`)
  return response.data.data
}

export async function updateSettings(input: Omit<AnnouncementSettings, 'id'>) {
  const response = await apiClient.put<ApiEnvelope<AnnouncementSettings>>(`${BASE}/settings`, input)
  return response.data.data
}

type AudioUploadTicket = {
  audioId: string
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
  expiresInSeconds: number
}

export async function completeAudioUpload(audioId: string) {
  const response = await apiClient.post<ApiEnvelope<AnnouncementAudio>>(
    `${BASE}/audios/${audioId}/upload-complete`,
  )
  return response.data.data
}

// This client has no backend authentication interceptors. Only signed R2 headers
// are sent to object storage, and the browser supplies Content-Length for the File.
const audioStorageClient = axios.create({ timeout: 300_000, withCredentials: false })

export async function uploadAudio(input: {
  file: File
  title: string
  description?: string
  category: AudioCategory
  durationMs?: number
  onProgress?: (percentage: number) => void
  onUploaded?: (audioId: string) => void
}) {
  input.onProgress?.(0)
  const response = await apiClient.post<ApiEnvelope<AudioUploadTicket>>(`${BASE}/audios/upload`, {
    title: input.title,
    description: input.description || undefined,
    category: input.category,
    fileName: input.file.name,
    mimeType: input.file.type,
    sizeBytes: input.file.size,
    durationMs: input.durationMs,
  })
  const ticket = response.data.data
  try {
    await audioStorageClient.request({
      url: ticket.uploadUrl,
      method: ticket.method,
      headers: ticket.headers,
      data: input.file,
      onUploadProgress: ({ loaded, total }) => {
        if (total) input.onProgress?.(Math.min(99, Math.round(loaded / total * 100)))
      },
    })
  } catch {
    throw new Error('Audio upload failed. Check your connection and try again.')
  }
  input.onUploaded?.(ticket.audioId)
  const audio = await completeAudioUpload(ticket.audioId)
  input.onProgress?.(100)
  return audio
}
