import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react'
import { useIsFetching, useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react'
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AudioLines,
  CheckCircle2,
  CirclePlus,
  CloudUpload,
  FileAudio2,
  Headphones,
  LoaderCircle,
  MapPinned,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { PageGradientHeader } from '@/components/page-gradient-header'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  deleteAudio,
  archiveRoute,
  announcementKeys,
  createRoute,
  completeAudioUpload,
  getRoute,
  getSettings,
  listAudios,
  listRoutes,
  restoreAudio,
  saveRoutePlaylist,
  updateAudio,
  updateRoute,
  updateSettings,
  uploadAudio,
} from '@/features/audio-app/announcements.service'
import type {
  AnnouncementAudio,
  AnnouncementRoute,
  AnnouncementRouteStatus,
  AnnouncementSettings,
  AudioCategory,
  RouteAudio,
} from '@/features/audio-app/types'
import { MobileUsersPanel } from '@/features/audio-app/mobile-users-panel'
import { useAudioMotion } from '@/features/audio-app/use-audio-motion'
import { usePermissions } from '@/hooks/use-permissions'
import { ApiError } from '@/lib/api/api-error'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

import './audio-app-page.css'

type Tab = 'routes' | 'audios' | 'settings' | 'mobile-users'

const categoryLabels: Record<AudioCategory, string> = {
  stop_announcement: 'Stop announcement',
  common_audio: 'Common audio',
  welcome_note: 'Welcome note',
}

const statusStyles: Record<AnnouncementRouteStatus, string> = {
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  archived: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
}

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong'
}

function formatBytes(value: string) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs) return null
  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Music2; title: string; description: string }) {
  const { reveal } = useAudioMotion()
  return (
    <motion.div {...reveal()} className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl border bg-background p-3.5 shadow-sm"><Icon className="size-6 text-violet-600 dark:text-violet-300" /></div>
      <p className="font-semibold tracking-tight">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </motion.div>
  )
}

function LoadingState() {
  const { reducedMotion } = useAudioMotion()
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-sm text-muted-foreground" role="status">
      <div className="relative flex size-12 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
        <motion.span aria-hidden animate={{ opacity: reducedMotion ? 1 : [0.45, 1, 0.45] }} transition={{ duration: 1.4, repeat: reducedMotion ? 0 : Infinity, ease: 'easeInOut' }}><AudioLines className="size-5" /></motion.span>
      </div>
      <span>Preparing your audio workspace…</span>
    </div>
  )
}

function RouteFormDialog({
  open,
  onOpenChange,
  route,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: AnnouncementRoute
}) {
  const [form, setForm] = useState<Pick<AnnouncementRoute, 'routeCode' | 'name' | 'origin' | 'destination' | 'via' | 'busType'>>(() => route ? {
    routeCode: route.routeCode,
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    via: route.via,
    busType: route.busType,
  } : { routeCode: '', name: '', origin: '', destination: '', via: '', busType: 'Non-AC' })

  const mutation = useMutation({
    mutationFn: () => route
      ? updateRoute(route.id, { ...form, expectedVersion: route.version })
      : createRoute(form),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.routes })
      await queryClient.invalidateQueries({ queryKey: announcementKeys.route(saved.id) })
      toast.success(route ? 'Route updated' : 'Route created')
      onOpenChange(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const valid = [form.routeCode, form.name, form.origin, form.destination].every((value) => value.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="audio-dialog max-h-[90svh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{route ? 'Edit route' : 'Create route'}</DialogTitle>
          <DialogDescription>Define the route shown to audio-app operators.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Route code
            <Input value={form.routeCode} onChange={(event) => setForm({ ...form, routeCode: event.target.value })} placeholder="BLR-HYD-01" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Route name
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Bengaluru to Hyderabad" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Origin
            <Input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} placeholder="Bengaluru" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Destination
            <Input value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="Hyderabad" />
          </label>
          <label className="grid gap-2 text-sm font-medium"><span>Via <span className="font-normal text-muted-foreground">(optional)</span></span>
            <Input maxLength={120} value={form.via} onChange={(event) => setForm({ ...form, via: event.target.value })} placeholder="Vijayawada" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Bus type
            <Select value={form.busType} onValueChange={(value) => setForm({ ...form, busType: value as AnnouncementRoute['busType'] })}>
              <SelectTrigger aria-label="Bus type"><SelectValue /></SelectTrigger>
              <SelectContent className="audio-select-content"><SelectItem value="AC">AC</SelectItem><SelectItem value="Non-AC">Non-AC</SelectItem></SelectContent>
            </Select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {route ? 'Save changes' : 'Create route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RoutesWorkspace({ audios }: { audios: AnnouncementAudio[] }) {
  const { can } = usePermissions()
  const { reducedMotion, transition, reveal } = useAudioMotion()
  const canCreate = can('announcements', 'routes', 'create')
  const canEdit = can('announcements', 'routes', 'edit')
  const canDelete = can('announcements', 'routes', 'delete')
  const canAssign = can('announcements', 'routes', 'assign_audio')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<AnnouncementRoute | undefined>()
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [playlistDraft, setPlaylistDraft] = useState<RouteAudio[] | null>(null)

  const routesQuery = useQuery({ queryKey: announcementKeys.routes, queryFn: listRoutes })
  const visibleRoutes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (routesQuery.data?.items ?? []).filter((route) => !term ||
      [route.routeCode, route.name, route.origin, route.destination, route.via, route.busType].some((value) => value.toLowerCase().includes(term)))
  }, [routesQuery.data, search])

  const routeQuery = useQuery({
    queryKey: announcementKeys.route(selectedId ?? ''),
    queryFn: () => getRoute(selectedId!),
    enabled: Boolean(selectedId),
  })
  const playlist = playlistDraft ?? routeQuery.data?.audios ?? []
  const dirty = playlistDraft !== null

  const savePlaylistMutation = useMutation({
    mutationFn: () => saveRoutePlaylist(routeQuery.data!.id, {
      expectedVersion: routeQuery.data!.version,
      items: playlist.map((item) => ({ audioId: item.audio.id, stopLabel: item.stopLabel || undefined })),
    }),
    onSuccess: async (saved) => {
      setPlaylistDraft(null)
      queryClient.setQueryData(announcementKeys.route(saved.id), saved)
      await queryClient.invalidateQueries({ queryKey: announcementKeys.routes })
      toast.success('Announcement order saved')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const routeStatusMutation = useMutation({
    mutationFn: (status: AnnouncementRouteStatus) => updateRoute(routeQuery.data!.id, {
      status,
      expectedVersion: routeQuery.data!.version,
    }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(announcementKeys.route(saved.id), saved)
      await queryClient.invalidateQueries({ queryKey: announcementKeys.routes })
      toast.success(saved.status === 'published' ? 'Route published' : 'Route moved to draft')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveRoute(routeQuery.data!.id, routeQuery.data!.version),
    onSuccess: async () => {
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: announcementKeys.routes })
      toast.success('Route archived')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const readyStops = audios.filter((audio) => audio.category === 'stop_announcement' && audio.status === 'ready' &&
    !playlist.some((item) => item.audio.id === audio.id))
  const route = routeQuery.data

  function addAudio() {
    const audio = readyStops.find((item) => item.id === selectedAudioId)
    if (!audio) return
    setPlaylistDraft((current) => [...(current ?? playlist), { id: `new-${audio.id}`, position: playlist.length + 1, audio }])
    setSelectedAudioId('')
  }

  function moveAudio(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= playlist.length) return
    setPlaylistDraft((current) => {
      const next = [...(current ?? playlist)]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function returnToRoutes() {
    if (dirty && !window.confirm('Leave without saving your announcement changes?')) return
    setSelectedId(null)
    setPlaylistDraft(null)
    setSelectedAudioId('')
  }

  if (routesQuery.isLoading) return <LoadingState />

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {!selectedId ? (
          <motion.div key="route-list" {...reveal()}>
            <Card className="audio-surface overflow-hidden rounded-2xl">
              <CardHeader className="space-y-5 border-b p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="text-xl tracking-tight">Choose a route</CardTitle>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Select a route to see or change the announcements passengers hear.</p>
                  </div>
                  {canCreate ? <Button className="h-11 w-full rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/15 hover:bg-violet-700 sm:w-auto" onClick={() => { setEditingRoute(undefined); setFormOpen(true) }}><Plus /> Add new route</Button> : null}
                </div>
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
                  <Input className="h-11 rounded-xl bg-background pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by route name, code, start, or destination" aria-label="Search routes" />
                </div>
                <p className="text-xs text-muted-foreground">Showing {visibleRoutes.length} of {routesQuery.data?.pagination.total ?? 0} routes</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {visibleRoutes.length ? (
                  <div className="audio-card-grid">
                    {visibleRoutes.map((item, index) => (
                      <motion.button
                        key={item.id}
                        {...reveal(search ? 0 : index)}
                        layout={reducedMotion ? false : 'position'}
                        whileHover={reducedMotion ? undefined : { y: -2 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.995 }}
                        type="button"
                        onClick={() => { setSelectedId(item.id); setPlaylistDraft(null) }}
                        className="audio-interactive-card group flex min-h-40 min-w-0 w-full flex-col rounded-2xl border bg-card p-4 text-left hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:p-5 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/5"
                      >
                        <div className="flex w-full items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-base font-semibold tracking-tight">{item.name}</p>
                            <p className="mt-1 break-words text-xs font-medium text-muted-foreground">Route {item.routeCode}</p>
                          </div>
                          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', statusStyles[item.status])}>{item.status}</span>
                        </div>
                        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><span className="truncate">{item.origin}</span><ArrowRight className="size-4 shrink-0 text-violet-500" /><span className="truncate">{item.destination}</span></div>
                        <p className="mb-4 mt-2 text-xs text-muted-foreground">{item.via ? `Via ${item.via}` : 'Direct route'} · {item.busType}</p>
                        <div className="mt-auto flex w-full items-center justify-between border-t pt-4 text-sm">
                          <span className="font-medium">{item._count?.audios ?? 0} {(item._count?.audios ?? 0) === 1 ? 'announcement' : 'announcements'}</span>
                          <span className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-300">Open route <ArrowRight className="size-4" /></span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : <EmptyState icon={MapPinned} title="No routes found" description={search ? 'Try a different route name, code, start, or destination.' : 'Add your first route to start organizing announcements.'} />}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key={`route-${selectedId}`} {...reveal()} className="min-w-0 space-y-4">
            <Button variant="ghost" className="-ml-2 h-10 text-muted-foreground hover:text-foreground" onClick={returnToRoutes}><ArrowLeft /> Back to all routes</Button>
            <Card className="audio-surface min-w-0 overflow-hidden rounded-2xl">
              {routeQuery.isLoading ? <LoadingState /> : route ? (
                <>
                  <CardHeader className="border-b bg-muted/20 p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Route announcements</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="break-words text-xl leading-snug sm:text-2xl">{route.name}</CardTitle>
                          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', statusStyles[route.status])}>{route.status}</span>
                        </div>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><MapPinned className="size-4" />{route.origin}<ArrowRight className="size-3" />{route.destination}<span>·</span>Route {route.routeCode}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{route.via ? `Via ${route.via}` : 'Direct route'} · {route.busType}</p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                        {canEdit ? <Button className="h-10" variant="outline" onClick={() => { setEditingRoute(route); setFormOpen(true) }}><Pencil /> Edit route details</Button> : null}
                        {canEdit ? <Button className="h-10" variant="outline" disabled={routeStatusMutation.isPending} onClick={() => routeStatusMutation.mutate(route.status === 'published' ? 'draft' : 'published')}><CheckCircle2 />{route.status === 'published' ? 'Stop sharing' : 'Make available to drivers'}</Button> : null}
                        {canDelete ? <Button className="h-10 text-destructive" variant="outline" disabled={archiveMutation.isPending} onClick={() => window.confirm('Archive this route?') && archiveMutation.mutate()}><Archive /> Archive route</Button> : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 sm:p-6">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">Announcements passengers will hear</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Drivers see this sequence and can tap any announcement to play. Use the buttons to change the order.</p>
                    </div>
                    {canAssign ? (
                      <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 sm:p-5 dark:border-violet-500/20 dark:bg-violet-500/[0.05]">
                        <div className="mb-4 flex items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">+</div>
                          <div><p className="font-semibold">Add an announcement</p><p className="mt-0.5 text-sm text-muted-foreground">Choose a ready audio file, then add it to the end of this route.</p></div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium">1. Choose an announcement
                            <Select value={selectedAudioId || undefined} onValueChange={setSelectedAudioId} disabled={!canAssign || readyStops.length === 0}>
                              <SelectTrigger aria-label="Choose route announcement" className="h-11 bg-background"><SelectValue placeholder={readyStops.length ? 'Select an announcement' : 'No unused announcements available'} /></SelectTrigger>
                              <SelectContent className="audio-select-content">{readyStops.map((audio) => <SelectItem key={audio.id} value={audio.id}>{audio.title}</SelectItem>)}</SelectContent>
                            </Select>
                          </label>
                          <Button className="h-11 shrink-0 bg-violet-600 text-white hover:bg-violet-700" disabled={!selectedAudioId || !canAssign} onClick={addAudio}><CirclePlus /> 2. Add to route</Button>
                        </div>
                        {!readyStops.length ? <p className="mt-3 text-xs text-muted-foreground">All ready stop announcements are already on this route. Upload more from the Audio library if needed.</p> : null}
                      </div>
                    ) : null}

                    <div className="relative space-y-3">
                      <AnimatePresence initial={false} mode="popLayout">
                        {playlist.length ? playlist.map((item, index) => (
                          <motion.div key={item.audio.id} {...reveal()} layout={reducedMotion ? false : 'position'} transition={transition} className="audio-playlist-row rounded-2xl border bg-card p-4 transition-colors hover:border-violet-200 dark:hover:border-violet-500/30">
                            <div className="audio-playlist-position flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold tabular-nums text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{String(index + 1).padStart(2, '0')}</div>
                            <div className="audio-playlist-details min-w-0">
                              <p className="break-words font-medium">{item.audio.title}</p>
                              <label className="mt-2 block text-xs text-muted-foreground">Stop name <span className="font-normal">(optional)</span>
                                <Input className="mt-1.5 h-10 bg-background" value={item.stopLabel ?? ''} disabled={!canAssign} placeholder="For example: Central Bus Stand" onChange={(event) => {
                                  const value = event.target.value
                                  setPlaylistDraft((current) => (current ?? playlist).map((row, rowIndex) => rowIndex === index ? { ...row, stopLabel: value } : row))
                                }} />
                              </label>
                            </div>
                            <audio aria-label={`Preview ${item.audio.title}`} className="audio-player audio-playlist-player h-10 w-full min-w-0" controls preload="none" src={item.audio.downloadUrl ?? item.audio.blobUrl ?? undefined} />
                            {canAssign ? (
                              <div className="audio-playlist-actions flex flex-wrap gap-1">
                                <Button aria-label={`Move ${item.audio.title} earlier`} className="h-9 justify-start px-2.5 text-xs" variant="ghost" disabled={index === 0} onClick={() => moveAudio(index, -1)}><ArrowUp /> Move earlier</Button>
                                <Button aria-label={`Move ${item.audio.title} later`} className="h-9 justify-start px-2.5 text-xs" variant="ghost" disabled={index === playlist.length - 1} onClick={() => moveAudio(index, 1)}><ArrowDown /> Move later</Button>
                                <Button aria-label={`Remove ${item.audio.title}`} variant="ghost" className="h-9 justify-start px-2.5 text-xs text-destructive" onClick={() => setPlaylistDraft((current) => (current ?? playlist).filter((_, rowIndex) => rowIndex !== index))}><Trash2 /> Remove</Button>
                              </div>
                            ) : null}
                          </motion.div>
                        )) : <motion.div key="empty-playlist" {...reveal()}><EmptyState icon={AudioLines} title="No announcements on this route yet" description="Use the simple add box above to choose the first announcement passengers should hear." /></motion.div>}
                      </AnimatePresence>
                    </div>

                    {canAssign ? (
                      <motion.div layout={reducedMotion ? false : 'position'} transition={transition} className={cn('flex flex-col gap-4 rounded-2xl border p-4 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between', dirty ? 'border-amber-300 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/[0.06]' : 'bg-muted/20')}>
                        <div className="flex items-center gap-3" role="status">
                          <motion.span key={String(dirty)} {...reveal()} className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', dirty ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300')}>{dirty ? <Save className="size-4" /> : <CheckCircle2 className="size-4" />}</motion.span>
                          <div>
                            <p className="text-sm font-semibold">{dirty ? 'Your changes are not saved yet' : 'Everything is saved'}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{dirty ? 'Save now so drivers receive the new announcement order.' : 'Drivers have the latest announcement order.'}</p>
                          </div>
                        </div>
                        <Button className="h-11 shrink-0 sm:min-w-40" disabled={!dirty || savePlaylistMutation.isPending} onClick={() => savePlaylistMutation.mutate()}>{savePlaylistMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save changes</Button>
                      </motion.div>
                    ) : null}
                  </CardContent>
                </>
              ) : <CardContent className="pt-6"><EmptyState icon={MapPinned} title="Select a route" description="Choose a route to manage its announcements." /></CardContent>}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {formOpen ? <RouteFormDialog key={editingRoute?.id ?? 'new'} open onOpenChange={setFormOpen} route={editingRoute} /> : null}
    </>
  )
}

function AudioUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { reducedMotion, transition, reveal } = useAudioMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AudioCategory>('stop_announcement')
  const [progress, setProgress] = useState(0)
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose an audio file')
      if (uploadedAudioId) {
        await completeAudioUpload(uploadedAudioId)
        setProgress(100)
      } else {
        await uploadAudio({ file, title, description, category, onProgress: setProgress, onUploaded: setUploadedAudioId })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.audios })
      toast.success('Audio uploaded and ready to use')
      onOpenChange(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  useEffect(() => {
    if (!mutation.isPending) return

    // Wait for the progress panel to mount, then reveal it inside the dialog.
    const frame = window.requestAnimationFrame(() => {
      progressRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [mutation.isPending, reducedMotion])

  function chooseFile(next: File | undefined) {
    if (!next) return
    if (!next.size) { toast.error('Choose a non-empty audio file'); return }
    if (!['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg'].includes(next.type)) { toast.error('Choose an MP3, M4A, AAC, WAV, or OGG file'); return }
    if (next.size > 50 * 1024 * 1024) { toast.error('Audio must be 50 MB or smaller'); return }
    setFile(next)
    setProgress(0)
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!mutation.isPending && !uploadedAudioId) chooseFile(event.dataTransfer.files?.[0])
  }

  const uploadStage = uploadedAudioId ? 'Processing and verifying' : progress > 0 ? 'Uploading securely' : 'Preparing upload'

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!mutation.isPending) onOpenChange(nextOpen) }}>
      <DialogContent className="audio-dialog max-h-[90svh] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-y-auto p-0">
        <div className="border-b bg-muted/20 p-5 sm:p-6">
          <DialogHeader className="pr-5 text-left">
            <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><CloudUpload className="size-5" /></div>
            <DialogTitle className="text-xl">Add audio to your library</DialogTitle>
            <DialogDescription>Upload a clear announcement, then add the details your team will see.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <motion.div
            role="button"
            tabIndex={mutation.isPending || uploadedAudioId ? -1 : 0}
            aria-disabled={mutation.isPending || Boolean(uploadedAudioId)}
            aria-label="Choose or drop an audio file"
            onClick={() => !mutation.isPending && !uploadedAudioId && inputRef.current?.click()}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!mutation.isPending && !uploadedAudioId) inputRef.current?.click() } }}
            onDragEnter={(event) => { event.preventDefault(); if (!mutation.isPending && !uploadedAudioId) setDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }}
            onDrop={handleDrop}
            animate={{ scale: dragging && !reducedMotion ? 1.01 : 1 }}
            transition={transition}
            className={cn(
              'group relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center outline-none transition-colors duration-200 sm:px-6 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
              dragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-border bg-muted/20 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-500/5',
              (mutation.isPending || uploadedAudioId) && 'cursor-default',
            )}
          >
            <motion.div aria-hidden animate={{ y: dragging && !reducedMotion ? -3 : 0 }} transition={transition} className="relative mb-4 flex size-12 items-center justify-center rounded-2xl bg-background text-violet-600 shadow-sm ring-1 ring-border dark:text-violet-300">
              {file ? <FileAudio2 className="size-7" /> : <CloudUpload className="size-7" />}
            </motion.div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={file ? `${file.name}-${file.size}-${file.lastModified}` : 'choose-file'} {...reveal()} className="flex w-full min-w-0 flex-col items-center" aria-live="polite">
                {file ? (
                  <>
                    <span className="max-w-full break-all font-semibold">{file.name}</span>
                    <span className="mt-1.5 text-sm text-muted-foreground">{formatBytes(String(file.size))} · {mutation.isPending ? 'Upload in progress' : uploadedAudioId ? 'Uploaded · awaiting verification' : 'Ready to upload'}</span>
                    {!mutation.isPending && !uploadedAudioId ? <span className="mt-3 text-xs font-medium text-violet-700 dark:text-violet-300">Click or drop another file to replace</span> : null}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Drop your audio file here</span>
                    <span className="mt-1.5 text-sm text-muted-foreground">or click to browse your device</span>
                    <span className="mt-4 rounded-full border bg-background/80 px-3 py-1 text-xs leading-5 text-muted-foreground">MP3, M4A, AAC, WAV or OGG · Max 50 MB</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <input ref={inputRef} className="hidden" type="file" disabled={mutation.isPending || Boolean(uploadedAudioId)} accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Title<Input className="h-11" disabled={mutation.isPending || Boolean(uploadedAudioId)} maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Majestic bus stand" /></label>
            <label className="grid gap-2 text-sm font-medium">Category
              <Select disabled={mutation.isPending || Boolean(uploadedAudioId)} value={category} onValueChange={(value) => setCategory(value as AudioCategory)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="audio-select-content">{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-xs font-normal leading-5 text-muted-foreground">For Dinner Break or Toilet Break, choose Common audio. After uploading, select the file in Mobile settings and save.</span>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium"><span>Description <span className="font-normal text-muted-foreground">(optional)</span></span><Textarea className="min-h-24 resize-none" disabled={mutation.isPending || Boolean(uploadedAudioId)} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Help operators understand where and when to use this audio" /></label>
          <AnimatePresence initial={false}>
            {mutation.isPending ? (
              <motion.div ref={progressRef} {...reveal()} className="scroll-m-24 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/[0.06]" aria-live="polite">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-semibold"><LoaderCircle className="size-4 animate-spin text-violet-600" />{uploadStage}</span><span className="tabular-nums text-muted-foreground">{uploadedAudioId ? 'Almost done' : `${progress}%`}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadedAudioId ? 100 : progress} aria-valuetext={uploadedAudioId ? 'Upload complete, verifying audio' : `${progress}% uploaded`}>
                  <motion.div className="h-full origin-left rounded-full bg-violet-600" initial={false} animate={{ scaleX: (uploadedAudioId ? 100 : progress) / 100 }} transition={transition} />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Keep this window open while we securely upload and check your file.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {uploadedAudioId && mutation.isError ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">Your file is uploaded. Retry verification to make it available in the audio library.</p> : null}
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /><span>Files are securely uploaded and validated before they become available.</span></div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
          <Button className="h-11" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 min-w-36 bg-violet-600 text-white hover:bg-violet-700" disabled={!file || !title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <CloudUpload />} {uploadedAudioId ? 'Retry verification' : 'Upload audio'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AudioLibrary({ audios, loading }: { audios: AnnouncementAudio[]; loading: boolean }) {
  const { can } = usePermissions()
  const { reducedMotion, reveal } = useAudioMotion()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | AudioCategory>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementAudio | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [view, setView] = useState<'library' | 'deleted'>('library')
  const [deletedPage, setDeletedPage] = useState(1)
  const [deleting, setDeleting] = useState<AnnouncementAudio | null>(null)
  const deletedQuery = useQuery({
    queryKey: [...announcementKeys.audios, 'deleted', { page: deletedPage, search, category }],
    queryFn: () => listAudios({ page: deletedPage, status: 'archived', search: search.trim() || undefined, category: category === 'all' ? undefined : category }),
    enabled: view === 'deleted',
  })

  const filtered = useMemo(() => audios.filter((audio) => {
    const matchesCategory = category === 'all' || audio.category === category
    const term = search.trim().toLowerCase()
    return matchesCategory && (!term || [audio.title, audio.originalFileName, audio.description ?? ''].some((value) => value.toLowerCase().includes(term)))
  }), [audios, category, search])

  const editMutation = useMutation({
    mutationFn: () => updateAudio(editing!.id, { title: editTitle, description: editDescription || null }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: announcementKeys.audios }); setEditing(null); toast.success('Audio details updated') },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteAudio,
    onSuccess: async () => { setDeleting(null); await queryClient.invalidateQueries({ queryKey: announcementKeys.audios }); toast.success('Audio moved to Recently deleted') },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const restoreMutation = useMutation({
    mutationFn: restoreAudio,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: announcementKeys.audios }); toast.success('Audio restored to the library') },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const displayed = view === 'deleted' ? deletedQuery.data?.items ?? [] : filtered
  const total = view === 'deleted' ? deletedQuery.data?.pagination.total ?? 0 : audios.length
  const totalPages = deletedQuery.data?.pagination.totalPages ?? 0

  if (loading && view === 'library') return <LoadingState />

  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="space-y-5 border-b p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><CardTitle className="text-xl tracking-tight">Audio library</CardTitle><p className="mt-1.5 text-sm leading-6 text-muted-foreground">One organized home for every reusable passenger announcement.</p></div>
          {view === 'library' && can('announcements', 'audios', 'upload') ? <Button className="h-11 w-full bg-violet-600 text-white shadow-md shadow-violet-600/15 hover:bg-violet-700 sm:w-auto" onClick={() => setUploadOpen(true)}><CloudUpload /> Upload audio</Button> : null}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Audio library views">
          <Button variant={view === 'library' ? 'default' : 'outline'} aria-pressed={view === 'library'} onClick={() => { setView('library'); setSearch(''); setCategory('all'); setDeletedPage(1) }}><Headphones /> Audio library</Button>
          <Button variant={view === 'deleted' ? 'default' : 'outline'} aria-pressed={view === 'deleted'} onClick={() => { setView('deleted'); setSearch(''); setCategory('all'); setDeletedPage(1) }}><Trash2 /> Recently deleted</Button>
        </div>
        {view === 'deleted' ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm leading-6 text-muted-foreground">Deleted audio is kept here until restored. Files are not permanently removed.{can('announcements', 'audios', 'delete') ? ' Restore an audio file to use it again.' : ' Ask an administrator with Delete / Restore permission to restore an audio file.'}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input aria-label={view === 'deleted' ? 'Search recently deleted audio' : 'Search audio library'} className="h-11 rounded-xl bg-background pl-10" value={search} onChange={(event) => { setSearch(event.target.value); setDeletedPage(1) }} placeholder="Search by title, file name, or description" /></div>
          <Select value={category} onValueChange={(value) => { setCategory(value as 'all' | AudioCategory); setDeletedPage(1) }}><SelectTrigger aria-label="Filter audio by category" className="h-11 rounded-xl sm:w-56"><SelectValue /></SelectTrigger><SelectContent className="audio-select-content"><SelectItem value="all">All categories</SelectItem>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">Showing {displayed.length} of {total} {view === 'deleted' ? 'deleted ' : ''}audio files</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {view === 'deleted' && deletedQuery.isLoading ? <LoadingState /> : view === 'deleted' && deletedQuery.isError ? <div role="alert" className="space-y-3 rounded-xl border p-5 text-destructive"><p>Unable to load recently deleted audio: {errorMessage(deletedQuery.error)}</p><Button variant="outline" onClick={() => void deletedQuery.refetch()}>Retry</Button></div> : displayed.length ? <div className="audio-card-grid">{displayed.map((audio, index) => (
          <motion.div key={audio.id} {...reveal(search || category !== 'all' ? 0 : index)} layout={reducedMotion ? false : 'position'} className="audio-interactive-card flex min-w-0 flex-col rounded-2xl border bg-card p-4 hover:border-violet-200 hover:shadow-md sm:p-5 dark:hover:border-violet-500/30">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Headphones className="size-5" /></div>
              <div className="min-w-0 flex-1"><p className="break-words font-semibold tracking-tight">{audio.title}</p><p title={audio.originalFileName} className="mt-1 truncate text-xs text-muted-foreground">{audio.originalFileName}</p></div>
              <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide', audio.status === 'archived' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300' : audio.status === 'ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : audio.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300')}>{audio.status === 'archived' ? 'Deleted' : audio.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-lg bg-muted px-2.5 py-1.5 font-medium">{categoryLabels[audio.category]}</span><span className="text-muted-foreground">{formatBytes(audio.sizeBytes)}</span>{formatDuration(audio.durationMs) ? <><span className="text-border">•</span><span className="text-muted-foreground">{formatDuration(audio.durationMs)}</span></> : null}</div>
            <p className="mt-4 min-h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">{audio.description || 'No description added.'}</p>
            <div className="mt-auto pt-5"><audio aria-label={`Preview ${audio.title}`} className="audio-player h-10 w-full min-w-0" controls preload="none" src={audio.downloadUrl ?? audio.blobUrl ?? undefined} /></div>
            <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
              {view === 'library' && can('announcements', 'audios', 'edit') ? <Button aria-label={`Edit ${audio.title}`} variant="ghost" className="h-10 px-3 text-muted-foreground hover:text-foreground" onClick={() => { setEditing(audio); setEditTitle(audio.title); setEditDescription(audio.description ?? '') }}><Pencil /><span>Edit</span></Button> : null}
              {can('announcements', 'audios', 'delete') ? view === 'deleted' ? <Button aria-label={`Restore ${audio.title}`} variant="outline" className="h-10 px-3" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(audio.id)}>{restoreMutation.isPending && restoreMutation.variables === audio.id ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}<span>Restore</span></Button> : <Button aria-label={`Delete ${audio.title}`} variant="ghost" className="h-10 px-3 text-muted-foreground hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => setDeleting(audio)}><Trash2 /><span>Delete</span></Button> : null}
            </div>
          </motion.div>
        ))}</div> : <EmptyState icon={view === 'deleted' ? Trash2 : Music2} title={view === 'deleted' ? 'No deleted audio found' : 'No audio found'} description={view === 'deleted' ? 'Deleted audio will appear here. If you expected a file, try changing the filters.' : 'Upload your first announcement or change the filters.'} />}
        {view === 'deleted' && (totalPages > 1 || deletedPage > 1) ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Page {deletedPage} of {Math.max(deletedPage, totalPages)}</p><div className="flex gap-2"><Button variant="outline" disabled={deletedPage <= 1 || deletedQuery.isFetching} onClick={() => setDeletedPage((page) => page - 1)}><ArrowLeft /> Previous</Button><Button variant="outline" disabled={deletedPage >= totalPages || deletedQuery.isFetching} onClick={() => setDeletedPage((page) => page + 1)}>Next <ArrowRight /></Button></div></div> : null}
      </CardContent>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleting(null) }}>
        <AlertDialogContent className="w-[calc(100%-2rem)]">
          <AlertDialogHeader><AlertDialogTitle>Delete audio?</AlertDialogTitle><AlertDialogDescription>“{deleting?.title}” will move to Recently deleted. You can restore it later. Audio used by a route or mobile settings must be removed from there first.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (deleting) deleteMutation.mutate(deleting.id) }}>{deleteMutation.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}{deleteMutation.isPending ? 'Deleting…' : 'Delete audio'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {uploadOpen ? <AudioUploadDialog open onOpenChange={setUploadOpen} /> : null}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="audio-dialog max-h-[90svh] w-[calc(100%-2rem)] overflow-y-auto"><DialogHeader><DialogTitle>Edit audio details</DialogTitle><DialogDescription>Update the operator-facing name and description.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-medium">Title<Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Description<Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editTitle.trim() || editMutation.isPending} onClick={() => editMutation.mutate()}><Save /> Save changes</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  )
}

function MobileSettings({ audios }: { audios: AnnouncementAudio[] }) {
  const { reveal } = useAudioMotion()
  const settingsQuery = useQuery({ queryKey: announcementKeys.settings, queryFn: getSettings })
  const [draft, setDraft] = useState<Partial<Omit<AnnouncementSettings, 'id'>>>({})
  const values = { dinnerBreakAudioId: null, toiletBreakAudioId: null, recordsDriveUrl: null, ...settingsQuery.data, ...draft }
  const mutation = useMutation({
    mutationFn: () => updateSettings({ dinnerBreakAudioId: values.dinnerBreakAudioId, toiletBreakAudioId: values.toiletBreakAudioId, recordsDriveUrl: values.recordsDriveUrl?.trim() || null }),
    onSuccess: (saved) => { queryClient.setQueryData(announcementKeys.settings, saved); setDraft({}); toast.success('Mobile app settings saved') },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const welcomeNotes = audios.filter((audio) => audio.category === 'welcome_note' && audio.status === 'ready')
  const common = audios.filter((audio) => audio.category === 'common_audio' && audio.status === 'ready')
  let validUrl = true
  if (values.recordsDriveUrl?.trim()) {
    try { const url = new URL(values.recordsDriveUrl.trim()); validUrl = url.protocol === 'https:' && url.hostname === 'drive.google.com' && !url.username && !url.password }
    catch { validUrl = false }
  }

  if (settingsQuery.isLoading) return <LoadingState />
  if (settingsQuery.isError) return <div role="alert" className="space-y-3 rounded-xl border p-5 text-destructive"><p>{errorMessage(settingsQuery.error)}</p><Button variant="outline" onClick={() => void settingsQuery.refetch()}>Retry settings</Button></div>
  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="border-b p-4 sm:p-6"><CardTitle className="text-xl tracking-tight">Mobile app settings</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">Configure quick announcements and the driver's records folder.</p></CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <h3 className="font-semibold">Welcome Note · {welcomeNotes.length} available</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Every ready Welcome note in the Audio library appears in the driver's selection list. Upload more welcome notes there.</p>
          <ul className="mt-3 space-y-2 text-sm">{welcomeNotes.map((audio) => <li key={audio.id} className="flex items-center gap-2"><Music2 className="size-4 text-muted-foreground" />{audio.title}</li>)}</ul>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          {([{ key: 'dinnerBreakAudioId', title: 'Dinner Break' }, { key: 'toiletBreakAudioId', title: 'Toilet Break' }] as const).map(({ key, title }) => {
            const selected = common.find((audio) => audio.id === values[key])
            return <section key={key} className="min-w-0 space-y-3 rounded-2xl border p-4 sm:p-5">
              <label className="grid gap-2 text-sm font-medium">{title}
                <Select disabled={mutation.isPending} value={values[key] ?? 'none'} onValueChange={(value) => setDraft((current) => ({ ...current, [key]: value === 'none' ? null : value }))}>
                  <SelectTrigger className="h-11" aria-label={`${title} audio`}><SelectValue /></SelectTrigger>
                  <SelectContent className="audio-select-content"><SelectItem value="none">Not configured</SelectItem>{values[key] && !selected ? <SelectItem value={values[key]!}>Unavailable audio — choose a replacement</SelectItem> : null}{common.map((audio) => <SelectItem key={audio.id} value={audio.id}>{audio.title}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <p className="text-xs leading-5 text-muted-foreground">Upload this announcement as Common audio in the Audio library, select it here, then Save settings. It plays directly when the driver taps {title}.</p>
              <div className="min-h-10">
                <AnimatePresence mode="wait" initial={false}>
                  {selected ? <motion.div key={selected.id} {...reveal()}><audio aria-label={`Preview ${title}`} className="audio-player h-10 w-full min-w-0" controls preload="none" src={selected.downloadUrl ?? selected.blobUrl ?? undefined} /></motion.div> : <motion.p key="unconfigured" {...reveal()} className="flex h-10 items-center gap-2 text-xs text-muted-foreground"><Headphones className="size-4" />Select an audio to preview it here.</motion.p>}
                </AnimatePresence>
              </div>
            </section>
          })}
        </div>
        <label className="grid gap-2 text-sm font-medium">Records · Google Drive URL
          <Input className="h-11" type="url" maxLength={1000} disabled={mutation.isPending} value={values.recordsDriveUrl ?? ''} aria-invalid={!validUrl} onChange={(event) => setDraft((current) => ({ ...current, recordsDriveUrl: event.target.value }))} placeholder="https://drive.google.com/drive/folders/..." />
          <span className={cn('block text-xs font-normal', validUrl ? 'text-muted-foreground' : 'text-destructive')}>{validUrl ? 'The Records button opens this folder. Leave blank to clear the configuration.' : 'Enter an HTTPS drive.google.com URL.'}</span>
        </label>
        <div className="border-t pt-5"><Button className="h-11 w-full sm:w-auto" disabled={mutation.isPending || !Object.keys(draft).length || !validUrl} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save settings</Button></div>
      </CardContent>
    </Card>
  )
}

export function AudioAppPage() {
  const { can } = usePermissions()
  const { reducedMotion, transition, reveal } = useAudioMotion()
  const tabsId = useId()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const refreshing = useIsFetching({ queryKey: ['announcements'] }) > 0
  const canViewRoutes = can('announcements', 'routes', 'view')
  const canViewAudios = can('announcements', 'audios', 'view')
  const canEditSettings = can('announcements', 'settings', 'edit')
  const canViewMobileUsers = can('announcements', 'mobile_users', 'view')
  const availableTabs = useMemo(() => [
    canViewRoutes ? { id: 'routes' as const, label: 'Routes', description: 'Build stop playlists', icon: MapPinned } : null,
    canViewAudios ? { id: 'audios' as const, label: 'Audio library', description: 'Upload and organize', icon: Headphones } : null,
    canEditSettings ? { id: 'settings' as const, label: 'Mobile settings', description: 'Quick audio & records', icon: Settings2 } : null,
    canViewMobileUsers ? { id: 'mobile-users' as const, label: 'Driver users', description: 'Control mobile access', icon: UsersRound } : null,
  ].filter((tab): tab is NonNullable<typeof tab> => Boolean(tab)), [canEditSettings, canViewAudios, canViewMobileUsers, canViewRoutes])
  const [tab, setTab] = useState<Tab>(availableTabs[0]?.id ?? 'routes')
  const activeTab = availableTabs.find((item) => item.id === tab)?.id ?? availableTabs[0]?.id
  const audiosQuery = useQuery({ queryKey: [...announcementKeys.audios, 'active'], queryFn: () => listAudios(), enabled: canViewAudios || canViewRoutes || canEditSettings })
  const audios = audiosQuery.data?.items ?? []
  const routesQuery = useQuery({ queryKey: announcementKeys.routes, queryFn: listRoutes, enabled: canViewRoutes })
  const published = routesQuery.data?.items.filter((route) => route.status === 'published').length ?? 0
  const ready = audios.filter((audio) => audio.status === 'ready').length
  const metrics = [
    { label: 'Configured routes', value: routesQuery.data?.pagination.total ?? '—', icon: MapPinned, tone: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
    { label: 'Published journeys', value: canViewRoutes && routesQuery.data ? published : '—', icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    { label: 'Audio files ready', value: audiosQuery.data ? ready : '—', icon: Headphones, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  ]

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <section className="audio-app-page mx-auto min-w-0 max-w-[1600px] space-y-5 pb-8 sm:space-y-6">
        <motion.div {...reveal()} className="audio-page-header">
          <PageGradientHeader eyebrow="Announcement management" title="Audio App" description="Create calm, consistent passenger journeys with organized audio and thoughtfully ordered route playlists." accent="violet" actions={
            <Button className="h-11 min-w-32" variant="outline" disabled={refreshing} onClick={() => { void queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.info('Refreshing announcement data') }}>
              <motion.span className="flex" animate={{ rotate: refreshing && !reducedMotion ? 360 : 0 }} transition={{ duration: refreshing && !reducedMotion ? 1 : 0, repeat: refreshing && !reducedMotion ? Infinity : 0, ease: 'linear' }}><RefreshCw className="size-4" /></motion.span>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          } />
        </motion.div>
        <motion.div {...reveal(1)}>
          <Card className="audio-surface overflow-hidden rounded-2xl" aria-label="Audio app summary">
            <CardContent className="grid grid-cols-3 divide-x p-0">
              {metrics.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="flex min-w-0 flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5 lg:p-6">
                  <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-11', tone)}><Icon className="size-4 sm:size-5" /></div>
                  <div className="min-w-0">
                    <motion.p key={value} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-semibold tabular-nums leading-none tracking-tight">{value}</motion.p>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground sm:text-sm sm:leading-5">{label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...reveal(2)}>
          <LayoutGroup id={tabsId}>
            <div className={cn('grid grid-cols-2 gap-1.5 rounded-2xl border bg-muted/30 p-1.5 lg:flex', availableTabs.length === 1 && 'grid-cols-1')} role="tablist" aria-label="Audio app sections">
              {availableTabs.map(({ id, label, description, icon: Icon }, index) => (
                <button
                  key={id}
                  ref={(node) => { tabRefs.current[id] = node }}
                  id={`${tabsId}-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={activeTab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  onKeyDown={(event) => {
                    let nextIndex: number
                    if (event.key === 'ArrowRight') nextIndex = (index + 1) % availableTabs.length
                    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + availableTabs.length) % availableTabs.length
                    else if (event.key === 'Home') nextIndex = 0
                    else if (event.key === 'End') nextIndex = availableTabs.length - 1
                    else return
                    event.preventDefault()
                    const nextTab = availableTabs[nextIndex].id
                    setTab(nextTab)
                    tabRefs.current[nextTab]?.focus()
                  }}
                  className="group relative isolate flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:min-h-[72px] sm:gap-3 sm:px-4"
                >
                  {activeTab === id ? <motion.span layoutId="active-audio-tab" className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200 bg-card shadow-sm dark:border-violet-500/30" transition={transition} /> : null}
                  <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 sm:size-9 sm:rounded-xl', activeTab === id ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground group-hover:text-foreground')}><Icon className="size-4" /></span>
                  <span className="relative min-w-0"><span className={cn('block text-xs font-semibold transition-colors sm:text-sm', activeTab === id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>{label}</span><span className="mt-1 hidden text-xs leading-4 text-muted-foreground sm:block">{description}</span></span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </motion.div>
        {audiosQuery.isError ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Unable to load audio: {errorMessage(audiosQuery.error)}</div> : null}
        <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${activeTab}`} tabIndex={0} className="min-h-72 min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeTab} {...reveal()} className="min-w-0">
              {activeTab === 'routes' ? <RoutesWorkspace audios={audios} /> : null}
              {activeTab === 'audios' ? <AudioLibrary audios={audios} loading={audiosQuery.isLoading} /> : null}
              {activeTab === 'settings' ? <MobileSettings audios={audios} /> : null}
              {activeTab === 'mobile-users' ? <MobileUsersPanel /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </MotionConfig>
  )
}
