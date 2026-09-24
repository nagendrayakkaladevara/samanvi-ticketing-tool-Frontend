export type AudioCategory = 'stop_announcement' | 'common_audio' | 'welcome_note'
export type AudioStatus = 'processing' | 'ready' | 'failed' | 'archived'
export type AnnouncementRouteStatus = 'draft' | 'published' | 'archived'

export type AnnouncementAudio = {
  id: string
  title: string
  description?: string | null
  category: AudioCategory
  status: AudioStatus
  fileName: string
  mimeType: string
  sizeBytes: string
  durationMs?: number | null
  blobUrl: string
  createdAt: string
  updatedAt: string
}

export type RouteAudio = {
  id: string
  position: number
  stopLabel?: string | null
  audio: AnnouncementAudio
}

export type AnnouncementRoute = {
  id: string
  routeCode: string
  name: string
  origin: string
  destination: string
  status: AnnouncementRouteStatus
  version: number
  createdAt: string
  updatedAt: string
  audios?: RouteAudio[]
  _count?: { audios: number }
}

export type AnnouncementSettings = {
  id: string
  activeWelcomeAudioId?: string | null
  activeWelcomeAudio?: AnnouncementAudio | null
}

export type Paginated<T> = {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

