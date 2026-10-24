import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AudioAppPage } from './AudioAppPage'
import { apiClient } from '@/lib/api/client'
import { ApiError } from '@/lib/api/api-error'
import { queryClient } from '@/lib/query/query-client'
import type { AnnouncementAudio, AnnouncementRoute } from '@/features/audio-app/types'

vi.mock('@/lib/api/client', () => ({ apiClient: { get: vi.fn(), put: vi.fn() } }))
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/features/audio-app/use-audio-motion', () => ({
  useAudioMotion: () => ({ reducedMotion: true, transition: { duration: 0 }, reveal: () => ({}) }),
}))
vi.mock('@/features/audio-app/mobile-users-panel', () => ({ MobileUsersPanel: () => null }))
vi.mock('@/features/audio-app/playback-alerts', () => ({ PlaybackAlerts: () => null }))

const audios: AnnouncementAudio[] = ['First stop', 'Second stop', 'Third stop'].map((title, index) => ({
  id: `audio-${index + 1}`, title, category: 'stop_announcement', status: 'ready',
  originalFileName: 'stop.mp3', mimeType: 'audio/mpeg', sizeBytes: '100',
  blobUrl: null, downloadUrl: null, createdAt: '', updatedAt: '',
}))
let savedRoute: AnnouncementRoute

async function tick(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

async function openRoute() {
  const router = createMemoryRouter([
    { path: '/audio-app', element: <AudioAppPage /> },
    { path: '/other', element: <p>Other page</p> },
  ], { initialEntries: ['/audio-app'] })
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
  await tick()
  fireEvent.click(screen.getByRole('button', { name: /Test route.*Open route/ }))
  await tick()
  return router
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  queryClient.clear()
  queryClient.setDefaultOptions({ queries: { retry: false }, mutations: { retry: false } })
  savedRoute = {
    id: 'route-1', routeCode: 'ST-01', name: 'Test route', origin: 'A', destination: 'B', via: '',
    busType: 'AC', status: 'published', version: 3, createdAt: '', updatedAt: '',
    audios: audios.slice(0, 2).map((audio, i) => ({ id: `item-${i}`, audio, position: i + 1 })),
    _count: { audios: 2 },
  }
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true }))
  vi.mocked(apiClient.get).mockImplementation(async (path) => ({ data: { success: true, data:
    path === '/announcements/routes' ? { items: [savedRoute], pagination: { total: 1 } }
      : path === '/announcements/routes/route-1' ? savedRoute
        : { items: audios, pagination: { total: 3 } },
  } }))
  vi.mocked(apiClient.put).mockImplementation(async (_path, data) => {
    const payload = data as { expectedVersion: number; items: { audioId: string; stopLabel?: string }[] }
    savedRoute = {
      ...savedRoute, version: payload.expectedVersion + 1,
      audios: payload.items.map((item, index) => ({ id: `saved-${index}`, position: index + 1, audio: audios.find((audio) => audio.id === item.audioId)!, stopLabel: item.stopLabel })),
    }
    return { data: { success: true, data: savedRoute } }
  })
})

describe('AudioAppPage route autosave', () => {
  it('uses primary blue actions and places the sticky save status before the editor', async () => {
    await openRoute()
    const status = screen.getByRole('status')
    expect(status.textContent).toContain('All changes saved')
    expect(status.parentElement?.className).toContain('sticky top-16')
    expect(screen.getByRole('button', { name: '2. Add to route' }).className).toContain('bg-primary')
    expect(screen.getByRole('button', { name: '2. Add to route' }).className).not.toContain('bg-violet')
    expect(status.compareDocumentPosition(screen.getByText('Announcements passengers will hear')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull()
  })

  it('autosaves move, stop-name and removal actions through the real service contract', async () => {
    await openRoute()
    fireEvent.click(screen.getByRole('button', { name: 'Move Second stop earlier' }))
    fireEvent.change(screen.getAllByRole('textbox', { name: /Stop name/ })[0], { target: { value: 'Central stand' } })
    await tick(1_999)
    expect(apiClient.put).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toContain('Changes waiting to save')
    expect(screen.getByRole('button', { name: 'Edit route details' }).hasAttribute('disabled')).toBe(true)
    await tick(1)
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith('/announcements/routes/route-1/audios', {
      expectedVersion: 3, items: [{ audioId: 'audio-2', stopLabel: 'Central stand' }, { audioId: 'audio-1', stopLabel: undefined }],
    })
    expect(screen.getByRole('status').textContent).toContain('All changes saved')
    fireEvent.click(screen.getByRole('button', { name: 'Remove First stop' }))
    await tick(2_000)
    expect(apiClient.put).toHaveBeenLastCalledWith('/announcements/routes/route-1/audios', {
      expectedVersion: 4, items: [{ audioId: 'audio-2', stopLabel: 'Central stand' }],
    })
  })

  it('continues saving across tabs and preserves the selected route', async () => {
    await openRoute()
    fireEvent.click(screen.getByRole('button', { name: 'Remove First stop' }))
    fireEvent.click(screen.getByRole('tab', { name: /Audio library/ }))
    await tick(2_000)
    expect(apiClient.put).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Upload audio' }).className).toContain('bg-primary')
    expect(screen.getByRole('button', { name: 'Upload audio' }).className).not.toContain('bg-violet')
    fireEvent.click(screen.getByRole('tab', { name: /Routes/ }))
    await tick()
    expect(screen.getByRole('status').textContent).toContain('All changes saved')
    expect(screen.queryByRole('button', { name: 'Remove First stop' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Second stop' })).toBeTruthy()
  })

  it('autosaves an audio selected and added from the announcement picker', async () => {
    await openRoute()
    // Radix scrolls the keyboard-selected option into view; jsdom has no layout.
    Element.prototype.scrollIntoView = vi.fn()
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Choose route announcement' }), { key: 'ArrowDown' })
    await tick()
    fireEvent.click(screen.getByRole('option', { name: 'Third stop' }))
    fireEvent.click(screen.getByRole('button', { name: '2. Add to route' }))
    await tick(2_000)
    expect(apiClient.put).toHaveBeenCalledExactlyOnceWith('/announcements/routes/route-1/audios', {
      expectedVersion: 3, items: audios.map((audio) => ({ audioId: audio.id, stopLabel: undefined })),
    })
    expect(screen.getByRole('button', { name: 'Remove Third stop' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('All changes saved')
  })

  it('shows conflicts and reloads only after confirming that local edits will be discarded', async () => {
    vi.mocked(apiClient.put).mockRejectedValueOnce(new ApiError('Version conflict', 409))
    vi.stubGlobal('confirm', vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true))
    await openRoute()
    fireEvent.click(screen.getByRole('button', { name: 'Remove First stop' }))
    await tick(2_000)
    expect(screen.getByRole('status').textContent).toContain('This route changed elsewhere')
    expect(screen.queryByRole('button', { name: 'Retry save' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reload route' }))
    await tick()
    expect(screen.queryByRole('button', { name: 'Remove First stop' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reload route' }))
    await tick()
    expect(screen.getByRole('button', { name: 'Remove First stop' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('All changes saved')
    expect(apiClient.put).toHaveBeenCalledTimes(1)
  })

  it('retains the draft after a failed save and retries from the visible status bar', async () => {
    vi.mocked(apiClient.put).mockRejectedValueOnce(new ApiError('Offline', 503))
    await openRoute()
    fireEvent.click(screen.getByRole('button', { name: 'Remove First stop' }))
    await tick(2_000)
    expect(screen.getByRole('status').textContent).toContain('Changes could not be saved')
    expect(screen.getByRole('status').textContent).toContain('Offline')
    expect(screen.queryByRole('button', { name: 'Remove First stop' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }))
    await tick()
    expect(screen.getByRole('status').textContent).toContain('All changes saved')
    expect(apiClient.put).toHaveBeenCalledTimes(2)
  })

  it('can save and leave through the navigation guard', async () => {
    const router = await openRoute()
    fireEvent.click(screen.getByRole('button', { name: 'Remove First stop' }))
    await act(async () => { await router.navigate('/other') })
    expect(screen.getByRole('alertdialog').textContent).toContain('Save your route changes before leaving?')
    fireEvent.click(screen.getByRole('button', { name: 'Save and leave' }))
    await tick()
    expect(screen.getByText('Other page')).toBeTruthy()
    expect(apiClient.put).toHaveBeenCalledTimes(1)
  })
})
