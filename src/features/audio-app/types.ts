export type AudioCategory = 'stop_announcement' | 'common_audio' | 'welcome_note'
export type AudioStatus = 'uploading' | 'ready' | 'failed' | 'archived'
export type AnnouncementRouteStatus = 'draft' | 'published' | 'archived'

export type AnnouncementAudio = {
  id: string
  title: string
  description?: string | null
  category: AudioCategory
  status: AudioStatus
  originalFileName: string
  mimeType: string
  sizeBytes: string
  durationMs?: number | null
  blobUrl: string | null
  downloadUrl: string | null
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
  via: string
  busType: 'AC' | 'Non-AC'
  status: AnnouncementRouteStatus
  version: number
  createdAt: string
  updatedAt: string
  audios?: RouteAudio[]
  _count?: { audios: number }
}

export type AnnouncementSettings = {
  id: string
  dinnerBreakAudioId: string | null
  toiletBreakAudioId: string | null
  recordsDriveUrl: string | null
}

export type Paginated<T> = {
  items: T[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}
