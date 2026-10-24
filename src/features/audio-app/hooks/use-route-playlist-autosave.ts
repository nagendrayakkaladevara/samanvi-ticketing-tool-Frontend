import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

import { announcementKeys, getRoute, saveRoutePlaylist } from '../announcements.service'
import type { AnnouncementRoute, RouteAudio } from '../types'
import { ApiError } from '@/lib/api/api-error'

const AUTOSAVE_DELAY_MS = 2_000

export function useRoutePlaylistAutosave(enabled: boolean) {
  const client = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RouteAudio[] | null>(null)
  // Event handlers and requests share the latest draft without waiting for a render.
  const draftRef = useRef<RouteAudio[] | null>(null)
  const baseRoute = useRef<AnnouncementRoute | undefined>(undefined)
  const changedAt = useRef(0)
  const inFlight = useRef<Promise<boolean> | null>(null)

  const routeQuery = useQuery({
    queryKey: announcementKeys.route(selectedId ?? ''),
    queryFn: () => getRoute(selectedId!),
    enabled: Boolean(selectedId),
  })

  const { mutateAsync, reset, isPending, error } = useMutation({
    mutationFn: ({ route, items }: { route: AnnouncementRoute; items: RouteAudio[] }) => saveRoutePlaylist(route.id, {
      expectedVersion: route.version,
      items: items.map((item) => ({ audioId: item.audio.id, stopLabel: item.stopLabel || undefined })),
    }),
    retry: false,
    onSuccess: (saved, snapshot) => {
      baseRoute.current = saved
      client.setQueryData(announcementKeys.route(saved.id), saved)
      // An older response must never clear edits made while its request was running.
      if (draftRef.current === snapshot.items) {
        draftRef.current = null
        setDraft(null)
      }
      // Do not refetch route details and replace the version under a local draft.
      void client.invalidateQueries({ queryKey: announcementKeys.routes, exact: true })
    },
  })

  const conflict = error instanceof ApiError && error.status === 409
  const dirty = draft !== null
  const playlist = draft ?? routeQuery.data?.audios ?? []

  const persist = useCallback((): Promise<boolean> => {
    if (inFlight.current) return inFlight.current
    if (!draftRef.current) return Promise.resolve(true)
    // Pin the version at the first edit. Background refreshes must not silently
    // rebase a local draft over another operator's changes.
    const route = baseRoute.current
    if (!enabled || !route) return Promise.resolve(false)

    const request = mutateAsync({ route, items: draftRef.current })
      .then(() => true, () => false)
      .finally(() => { inFlight.current = null })
    inFlight.current = request
    return request
  }, [enabled, mutateAsync])

  const saveNow = useCallback(async () => {
    if (conflict) return false
    // Navigation and manual saves also wait for any newer edits behind a request.
    while (draftRef.current || inFlight.current) {
      if (!await persist()) return false
    }
    return true
  }, [conflict, persist])

  useEffect(() => {
    if (!dirty || !enabled || isPending || error) return
    const remaining = Math.max(0, AUTOSAVE_DELAY_MS - (Date.now() - changedAt.current))
    const timer = window.setTimeout(() => { void persist() }, remaining)
    return () => window.clearTimeout(timer)
  }, [draft, dirty, enabled, error, isPending, persist])

  const blocker = useBlocker(dirty || isPending)
  useBeforeUnload(useCallback((event) => {
    if (!dirty && !isPending) return
    event.preventDefault()
    event.returnValue = ''
  }, [dirty, isPending]))

  const updatePlaylist = (update: (current: RouteAudio[]) => RouteAudio[]) => {
    if (!enabled) return
    if (!draftRef.current) baseRoute.current = routeQuery.data
    const current = draftRef.current ?? routeQuery.data?.audios ?? []
    const next = update(current)
    if (next === current) return
    draftRef.current = next
    changedAt.current = Date.now()
    setDraft(next)
    // Conflicts need an explicit reload; other failures may retry on the next edit.
    if (error && !conflict) reset()
  }

  const openRoute = (id: string) => {
    if (draftRef.current || inFlight.current) return
    reset()
    setSelectedId(id)
  }

  const closeRoute = async () => {
    if (!await saveNow()) return
    reset()
    setSelectedId(null)
  }

  const reloadRoute = async () => {
    if (inFlight.current) return
    const result = await routeQuery.refetch()
    if (result.isError) return
    draftRef.current = null
    setDraft(null)
    reset()
  }

  return {
    selectedId, routeQuery, playlist, dirty, isSaving: isPending, error, conflict,
    openRoute, closeRoute, updatePlaylist, saveNow, reloadRoute, blocker,
  }
}

export type RoutePlaylistEditor = ReturnType<typeof useRoutePlaylistAutosave>
