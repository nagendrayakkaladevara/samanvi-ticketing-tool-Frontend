import { createContext, useContext, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { announcementKeys, getRoute, saveRoutePlaylist } from '../announcements.service'
import type { AnnouncementAudio, AnnouncementRoute, RouteAudio } from '../types'
import { ApiError } from '@/lib/api/api-error'
import { useRoutePlaylistAutosave } from './use-route-playlist-autosave'

vi.mock('../announcements.service', () => ({
  announcementKeys: { routes: ['announcements', 'routes'], route: (id: string) => ['announcements', 'routes', id] },
  getRoute: vi.fn(),
  saveRoutePlaylist: vi.fn(),
}))

const audio: AnnouncementAudio = {
  id: 'audio-1', title: 'First stop', category: 'stop_announcement', status: 'ready',
  originalFileName: 'stop.mp3', mimeType: 'audio/mpeg', sizeBytes: '100',
  blobUrl: null, downloadUrl: null, createdAt: '', updatedAt: '',
}
const first: RouteAudio = { id: 'item-1', position: 1, audio }
const second: RouteAudio = { id: 'item-2', position: 2, audio: { ...audio, id: 'audio-2', title: 'Second stop' } }
const route: AnnouncementRoute = {
  id: 'route-1', routeCode: 'ST-01', name: 'Test route', origin: 'A', destination: 'B', via: '',
  busType: 'AC', status: 'published', version: 3, createdAt: '', updatedAt: '', audios: [first],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

async function tick(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

const HookContext = createContext<ReactNode>(null)
function HookContent() { return useContext(HookContext) }

function setup(enabled = true, seed: AnnouncementRoute = route) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  client.setQueryData(announcementKeys.route(seed.id), seed)
  const router = createMemoryRouter([
    { path: '/', element: <HookContent /> },
    { path: '/other', element: <p>Other page</p> },
  ])
  function Wrapper({ children }: { children: ReactNode }) {
    return <HookContext.Provider value={children}><QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider></HookContext.Provider>
  }
  const hook = renderHook(({ allowed }) => useRoutePlaylistAutosave(allowed), {
    wrapper: Wrapper, initialProps: { allowed: enabled },
  })
  act(() => hook.result.current.openRoute(seed.id))
  return { ...hook, client, router }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-24T10:00:00Z'))
  vi.mocked(getRoute).mockResolvedValue(route)
  vi.mocked(saveRoutePlaylist).mockImplementation(async (id, input) => ({
    ...route, id, version: input.expectedVersion + 1,
    audios: input.items.map((item, index) => ({
      id: `saved-${index}`, position: index + 1, stopLabel: item.stopLabel,
      audio: item.audioId === first.audio.id ? first.audio : second.audio,
    })),
  }))
})

describe('useRoutePlaylistAutosave', () => {
  it('does not save initial data or a no-op update', async () => {
    const { result } = setup()
    act(() => result.current.updatePlaylist((items) => items))
    await tick(5_000)
    expect(result.current.playlist).toEqual([first])
    expect(result.current.dirty).toBe(false)
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
    expect(await result.current.saveNow()).toBe(true)
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('saves the latest edit only after a full two-second idle period', async () => {
    const { result, client } = setup()
    act(() => result.current.updatePlaylist((items) => [...items, second]))
    await tick(1_500)
    act(() => result.current.updatePlaylist((items) => [...items].reverse()))
    await tick(1_999)
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
    await tick(1)
    expect(saveRoutePlaylist).toHaveBeenCalledExactlyOnceWith('route-1', {
      expectedVersion: 3, items: [{ audioId: 'audio-2', stopLabel: undefined }, { audioId: 'audio-1', stopLabel: undefined }],
    })
    expect(result.current.dirty).toBe(false)
    expect(client.getQueryData<AnnouncementRoute>(announcementKeys.route(route.id))?.version).toBe(4)
    await tick(5_000)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['stop-name edit', [{ ...first, stopLabel: 'Central stand' }], [{ audioId: 'audio-1', stopLabel: 'Central stand' }]],
    ['remove last audio', [], []],
  ] as const)('autosaves a %s', async (_name, items, expected) => {
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => [...items]))
    await tick(2_000)
    expect(saveRoutePlaylist).toHaveBeenCalledWith('route-1', { expectedVersion: 3, items: expected })
    expect(result.current.dirty).toBe(false)
  })

  it('serializes requests and retains newer edits when an older save finishes', async () => {
    const request = deferred<AnnouncementRoute>()
    const nextRequest = deferred<AnnouncementRoute>()
    vi.mocked(saveRoutePlaylist).mockReturnValueOnce(request.promise).mockReturnValueOnce(nextRequest.promise)
    const { result } = setup()
    const initialEdit = [{ ...first, stopLabel: 'Old label' }]
    const latestEdit = [{ ...first, stopLabel: 'Latest label' }, second]
    act(() => result.current.updatePlaylist(() => initialEdit))
    await tick(2_000)
    expect(result.current.isSaving).toBe(true)
    act(() => result.current.updatePlaylist(() => latestEdit))
    await tick(2_500)
    expect(result.current.isSaving).toBe(true)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    await act(async () => { request.resolve({ ...route, version: 4, audios: initialEdit }) })
    expect(result.current.playlist).toEqual(latestEdit)
    expect(result.current.dirty).toBe(true)
    await tick()
    expect(saveRoutePlaylist).toHaveBeenLastCalledWith('route-1', {
      expectedVersion: 4, items: [{ audioId: 'audio-1', stopLabel: 'Latest label' }, { audioId: 'audio-2', stopLabel: undefined }],
    })
    await act(async () => { nextRequest.resolve({ ...route, version: 5, audios: latestEdit }) })
    await tick()
    expect(result.current.dirty).toBe(false)
  })

  it('waits for the remaining idle time when an in-flight save finishes quickly', async () => {
    const request = deferred<AnnouncementRoute>()
    vi.mocked(saveRoutePlaylist).mockReturnValueOnce(request.promise)
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    await tick(2_000)
    act(() => result.current.updatePlaylist(() => [second]))
    await tick(500)
    await act(async () => { request.resolve({ ...route, version: 4, audios: [] }) })
    await tick(1_499)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    await tick(1)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(2)
  })

  it('flushes immediately, deduplicates manual saves and waits for newer edits', async () => {
    const request = deferred<AnnouncementRoute>()
    vi.mocked(saveRoutePlaylist).mockReturnValueOnce(request.promise)
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    let saves!: Promise<boolean[]>
    act(() => { saves = Promise.all([result.current.saveNow(), result.current.saveNow()]) })
    act(() => result.current.updatePlaylist(() => [second]))
    await tick()
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    await act(async () => {
      request.resolve({ ...route, version: 4, audios: [] })
      expect(await saves).toEqual([true, true])
    })
    await tick()
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(2)
    expect(result.current.dirty).toBe(false)
  })

  it('preserves edits on error, pauses automatic retries and supports retry', async () => {
    vi.mocked(saveRoutePlaylist).mockRejectedValueOnce(new Error('Offline'))
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => [second]))
    await tick(2_000)
    expect(result.current.error?.message).toBe('Offline')
    expect(result.current.dirty).toBe(true)
    expect(result.current.playlist).toEqual([second])
    await tick(10_000)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    await act(async () => { expect(await result.current.saveNow()).toBe(true) })
    await tick()
    expect(result.current.error).toBeNull()
    expect(result.current.dirty).toBe(false)
  })

  it('restarts the debounce on a new edit after a non-conflict failure', async () => {
    vi.mocked(saveRoutePlaylist).mockRejectedValueOnce(new Error('Offline'))
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    await tick(2_000)
    act(() => result.current.updatePlaylist(() => [second]))
    await tick(1_999)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    await tick(1)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(2)
  })

  it('keeps the editor open if a flush fails and does not switch dirty routes', async () => {
    vi.mocked(saveRoutePlaylist).mockRejectedValueOnce(new Error('Offline'))
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    act(() => result.current.openRoute('route-2'))
    expect(result.current.selectedId).toBe(route.id)
    await act(async () => { await result.current.closeRoute() })
    expect(result.current.selectedId).toBe(route.id)
    expect(result.current.dirty).toBe(true)
  })

  it('flushes before closing the route and can open another route afterwards', async () => {
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    await act(async () => { await result.current.closeRoute() })
    await tick()
    expect(result.current.selectedId).toBeNull()
    act(() => result.current.openRoute('route-2'))
    expect(result.current.selectedId).toBe('route-2')
  })

  it('pins the expected version despite background refreshes and preserves conflicts', async () => {
    vi.mocked(saveRoutePlaylist).mockRejectedValueOnce(new ApiError('Version conflict', 409))
    const { result, client } = setup()
    act(() => result.current.updatePlaylist(() => [second]))
    act(() => { client.setQueryData(announcementKeys.route(route.id), { ...route, version: 99 }) })
    await tick(2_000)
    expect(saveRoutePlaylist).toHaveBeenLastCalledWith('route-1', { expectedVersion: 3, items: [{ audioId: 'audio-2', stopLabel: undefined }] })
    expect(result.current.conflict).toBe(true)
    act(() => result.current.updatePlaylist(() => []))
    await tick(10_000)
    expect(await result.current.saveNow()).toBe(false)
    expect(saveRoutePlaylist).toHaveBeenCalledTimes(1)
    expect(result.current.dirty).toBe(true)
    vi.mocked(getRoute).mockResolvedValueOnce({ ...route, version: 100 })
    await act(async () => { await result.current.reloadRoute() })
    await tick()
    expect(result.current.playlist).toEqual([first])
    expect(result.current.dirty).toBe(false)
    expect(result.current.conflict).toBe(false)
    act(() => result.current.updatePlaylist(() => []))
    await tick(2_000)
    expect(saveRoutePlaylist).toHaveBeenLastCalledWith('route-1', { expectedVersion: 100, items: [] })
  })

  it('keeps the draft if reloading fails and refuses to reload during a save', async () => {
    const request = deferred<AnnouncementRoute>()
    vi.mocked(saveRoutePlaylist).mockReturnValueOnce(request.promise)
    const { result } = setup()
    act(() => result.current.updatePlaylist(() => []))
    await tick(2_000)
    act(() => result.current.openRoute('route-2'))
    await act(async () => { await result.current.reloadRoute() })
    expect(getRoute).not.toHaveBeenCalled()
    expect(result.current.selectedId).toBe(route.id)
    await act(async () => { request.resolve({ ...route, version: 4, audios: [] }) })
    await tick()
    act(() => result.current.updatePlaylist(() => [second]))
    vi.mocked(getRoute).mockRejectedValueOnce(new Error('Offline'))
    await act(async () => { await result.current.reloadRoute() })
    await tick()
    expect(result.current.dirty).toBe(true)
    expect(result.current.playlist).toEqual([second])
  })

  it('does not modify or save when assignment permission is missing', async () => {
    const { result } = setup(false)
    act(() => result.current.updatePlaylist(() => []))
    await tick(3_000)
    expect(result.current.dirty).toBe(false)
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
  })

  it('pauses dirty saves if assignment permission is revoked', async () => {
    const { result, rerender } = setup()
    act(() => result.current.updatePlaylist(() => []))
    rerender({ allowed: false })
    await tick(3_000)
    expect(await result.current.saveNow()).toBe(false)
    expect(result.current.dirty).toBe(true)
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
  })

  it('handles routes with no playlist and guards edits before route data loads', async () => {
    const { result, client } = setup(true, { ...route, audios: undefined })
    expect(result.current.playlist).toEqual([])
    await act(async () => { await result.current.closeRoute() })
    expect(result.current.playlist).toEqual([])
    client.removeQueries({ queryKey: announcementKeys.route(route.id) })
    act(() => result.current.updatePlaylist(() => [second]))
    await act(async () => { expect(await result.current.saveNow()).toBe(false) })
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
  })

  it('blocks page navigation and browser unload until edits are saved or discarded', async () => {
    const { result, router } = setup()
    act(() => result.current.updatePlaylist(() => [second]))
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await act(async () => { await router.navigate('/other') })
    expect(result.current.blocker.state).toBe('blocked')
    act(() => result.current.blocker.reset?.())
    expect(router.state.location.pathname).toBe('/')
    await act(async () => { expect(await result.current.saveNow()).toBe(true) })
    await tick()
    await act(async () => { await router.navigate('/other') })
    expect(router.state.location.pathname).toBe('/other')
  })

  it('cancels a pending debounce when the page unmounts', async () => {
    const { result, unmount } = setup()
    act(() => result.current.updatePlaylist(() => []))
    unmount()
    await tick(3_000)
    expect(saveRoutePlaylist).not.toHaveBeenCalled()
  })
})
