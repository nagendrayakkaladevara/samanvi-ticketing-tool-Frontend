import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Archive,
  ArrowDown,
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
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { PageGradientHeader } from '@/components/page-gradient-header'
import { Button } from '@/components/ui/button'
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
  archiveAudio,
  archiveRoute,
  announcementKeys,
  createRoute,
  completeAudioUpload,
  getRoute,
  getSettings,
  listAudios,
  listRoutes,
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
  AudioCategory,
  RouteAudio,
} from '@/features/audio-app/types'
import { MobileUsersPanel } from '@/features/audio-app/mobile-users-panel'
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
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200/80 bg-violet-50/30 px-6 py-12 text-center dark:border-violet-500/20 dark:bg-violet-500/[0.04]">
      <div className="mb-4 rounded-2xl border bg-background p-3.5 shadow-sm"><Icon className="size-6 text-violet-600 dark:text-violet-300" /></div>
      <p className="font-semibold tracking-tight">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-sm text-muted-foreground" role="status">
      <div className="relative flex size-12 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
        <AudioLines className="size-5" />
        <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-400/40 motion-reduce:animate-none" />
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
  const [form, setForm] = useState(() => route ? {
    routeCode: route.routeCode,
    name: route.name,
    origin: route.origin,
    destination: route.destination,
  } : { routeCode: '', name: '', origin: '', destination: '' })

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

  const valid = Object.values(form).every((value) => value.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{route ? 'Edit route' : 'Create route'}</DialogTitle>
          <DialogDescription>Define the route shown to audio-app operators.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">Route code
            <Input value={form.routeCode} onChange={(event) => setForm({ ...form, routeCode: event.target.value })} placeholder="BLR-HYD-01" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">Route name
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Bengaluru to Hyderabad" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">Origin
            <Input value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} placeholder="Bengaluru" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">Destination
            <Input value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="Hyderabad" />
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
      [route.routeCode, route.name, route.origin, route.destination].some((value) => value.toLowerCase().includes(term)))
  }, [routesQuery.data, search])

  const activeRouteId = selectedId ?? visibleRoutes[0]?.id ?? null

  const routeQuery = useQuery({
    queryKey: announcementKeys.route(activeRouteId ?? ''),
    queryFn: () => getRoute(activeRouteId!),
    enabled: Boolean(activeRouteId),
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

  if (routesQuery.isLoading) return <LoadingState />

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="audio-surface h-fit overflow-hidden rounded-2xl xl:sticky xl:top-20">
        <CardHeader className="space-y-5 border-b p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><CardTitle className="text-lg">Routes</CardTitle><p className="mt-1 text-xs text-muted-foreground">{routesQuery.data?.pagination.total ?? 0} configured</p></div>
            {canCreate ? <Button className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingRoute(undefined); setFormOpen(true) }}><Plus /> New route</Button> : null}
          </div>
          <div className="relative"><Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 rounded-xl pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes" /></div>
        </CardHeader>
        <CardContent className="max-h-[62vh] space-y-2.5 overflow-y-auto p-3 sm:p-4">
          {visibleRoutes.length ? visibleRoutes.map((item) => (
            <Button key={item.id} type="button" variant="outline" onClick={() => { setSelectedId(item.id); setPlaylistDraft(null) }} className={cn('h-auto min-h-24 w-full flex-col items-stretch gap-0 rounded-xl p-4 text-left font-normal shadow-none transition-all hover:border-violet-200 hover:bg-violet-50/40 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/5', activeRouteId === item.id && 'border-violet-400 bg-violet-50/70 ring-1 ring-violet-300 dark:bg-violet-500/10')}>
              <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.routeCode}</p></div><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusStyles[item.status])}>{item.status}</span></div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span>{item.origin}</span><ArrowRight className="size-3" /><span>{item.destination}</span><span className="ml-auto">{item._count?.audios ?? 0} stops</span></div>
            </Button>
          )) : <EmptyState icon={MapPinned} title="No routes found" description="Create a route or change your search." />}
        </CardContent>
      </Card>

      <Card className="audio-surface min-w-0 overflow-hidden rounded-2xl">
        {routeQuery.isLoading ? <LoadingState /> : route ? (
          <>
             <CardHeader className="border-b p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><CardTitle>{route.name}</CardTitle><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusStyles[route.status])}>{route.status}</span></div><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPinned className="size-4" />{route.origin}<ArrowRight className="size-3" />{route.destination}<span>·</span>{route.routeCode}</p></div>
                <div className="flex flex-wrap gap-2">
                  {canEdit ? <Button className="h-10" variant="outline" onClick={() => { setEditingRoute(route); setFormOpen(true) }}><Pencil /> Edit</Button> : null}
                  {canEdit ? <Button className="h-10" variant="outline" disabled={routeStatusMutation.isPending} onClick={() => routeStatusMutation.mutate(route.status === 'published' ? 'draft' : 'published')}><CheckCircle2 />{route.status === 'published' ? 'Unpublish' : 'Publish'}</Button> : null}
                  {canDelete ? <Button className="h-10 text-destructive" variant="outline" disabled={archiveMutation.isPending} onClick={() => window.confirm('Archive this route?') && archiveMutation.mutate()}><Archive /> Archive</Button> : null}
                </div>
              </div>
            </CardHeader>
             <CardContent className="space-y-6 p-5 sm:p-7">
               <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-end sm:p-5">
                <label className="min-w-56 flex-1 space-y-1.5 text-sm font-medium">Add stop announcement
                  <Select value={selectedAudioId || undefined} onValueChange={setSelectedAudioId} disabled={!canAssign || readyStops.length === 0}>
                    <SelectTrigger><SelectValue placeholder={readyStops.length ? 'Select an available audio' : 'No available stop audio'} /></SelectTrigger>
                    <SelectContent>{readyStops.map((audio) => <SelectItem key={audio.id} value={audio.id}>{audio.title}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                 <Button className="h-10" variant="outline" disabled={!selectedAudioId || !canAssign} onClick={addAudio}><CirclePlus /> Add to route</Button>
              </div>

              {playlist.length ? <div className="space-y-3">{playlist.map((item, index) => (
                 <div key={item.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-violet-200 sm:flex-row sm:items-center dark:hover:border-violet-500/30">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{index + 1}</div>
                   <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.audio.title}</p><Input className="mt-2 h-10" value={item.stopLabel ?? ''} disabled={!canAssign} placeholder="Optional stop label" onChange={(event) => { const value = event.target.value; setPlaylistDraft((current) => (current ?? playlist).map((row, rowIndex) => rowIndex === index ? { ...row, stopLabel: value } : row)) }} /></div>
                   <audio className="h-10 w-full max-w-52" controls preload="none" src={item.audio.downloadUrl ?? item.audio.blobUrl ?? undefined} />
                  {canAssign ? <div className="flex gap-1">
                    <Button aria-label="Move up" className="size-11" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveAudio(index, -1)}><ArrowUp /></Button>
                    <Button aria-label="Move down" className="size-11" variant="ghost" size="icon" disabled={index === playlist.length - 1} onClick={() => moveAudio(index, 1)}><ArrowDown /></Button>
                    <Button aria-label="Remove audio" variant="ghost" size="icon" className="size-11 text-destructive" onClick={() => setPlaylistDraft((current) => (current ?? playlist).filter((_, rowIndex) => rowIndex !== index))}><Trash2 /></Button>
                  </div> : null}
                </div>
              ))}</div> : <EmptyState icon={AudioLines} title="No stop announcements" description="Add ready stop audio above to build this route's playback order." />}

              {canAssign ? <div className="flex items-center justify-between border-t pt-4"><p className="text-xs text-muted-foreground">{dirty ? 'You have unsaved playlist changes.' : 'Playlist is up to date.'}</p><Button disabled={!dirty || savePlaylistMutation.isPending} onClick={() => savePlaylistMutation.mutate()}>{savePlaylistMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save order</Button></div> : null}
            </CardContent>
          </>
        ) : <CardContent className="pt-6"><EmptyState icon={MapPinned} title="Select a route" description="Choose a route to manage its announcements." /></CardContent>}
      </Card>
      {formOpen ? <RouteFormDialog key={editingRoute?.id ?? 'new'} open onOpenChange={setFormOpen} route={editingRoute} /> : null}
    </div>
  )
}

function AudioUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
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
      <DialogContent className="max-h-[92svh] max-w-2xl gap-0 overflow-y-auto p-0">
        <div className="border-b bg-gradient-to-br from-violet-50 via-background to-sky-50 px-5 py-5 sm:px-7 dark:from-violet-500/10 dark:to-sky-500/5">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><CloudUpload className="size-5" /></div>
            <DialogTitle className="text-xl">Add audio to your library</DialogTitle>
            <DialogDescription>Upload a clear announcement, then add the details your team will see.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-6 px-5 py-6 sm:px-7">
          <div
            role="button"
            tabIndex={mutation.isPending || uploadedAudioId ? -1 : 0}
            aria-label="Choose or drop an audio file"
            onClick={() => !mutation.isPending && !uploadedAudioId && inputRef.current?.click()}
            onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && !mutation.isPending && !uploadedAudioId) inputRef.current?.click() }}
            onDragEnter={(event) => { event.preventDefault(); if (!mutation.isPending && !uploadedAudioId) setDragging(true) }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }}
            onDrop={handleDrop}
            className={cn(
              'group relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-8 text-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
              dragging ? 'scale-[1.01] border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10 dark:bg-violet-500/10' : 'border-border bg-muted/20 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-500/5',
              (mutation.isPending || uploadedAudioId) && 'cursor-default',
            )}
          >
            <div aria-hidden className="audio-upload-orbit absolute size-32 rounded-full border border-violet-300/30" />
            <div className={cn('relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-background text-violet-600 shadow-md ring-1 ring-border transition-transform duration-300 dark:text-violet-300', dragging && 'scale-110')}>
              {file ? <FileAudio2 className="size-7" /> : <CloudUpload className="size-7" />}
            </div>
            {file ? (
              <>
                <span className="relative max-w-full truncate font-semibold">{file.name}</span>
                <span className="relative mt-1.5 text-sm text-muted-foreground">{formatBytes(String(file.size))} · Ready to upload</span>
                {!mutation.isPending && !uploadedAudioId ? <span className="relative mt-3 text-xs font-medium text-violet-700 dark:text-violet-300">Click or drop another file to replace</span> : null}
              </>
            ) : (
              <>
                <span className="relative font-semibold">Drop your audio file here</span>
                <span className="relative mt-1.5 text-sm text-muted-foreground">or click to browse your device</span>
                <span className="relative mt-4 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">MP3, M4A, AAC, WAV or OGG · Max 50 MB</span>
              </>
            )}
          </div>
        <input ref={inputRef} className="hidden" type="file" disabled={mutation.isPending || Boolean(uploadedAudioId)} accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Title<Input className="h-11" disabled={mutation.isPending || Boolean(uploadedAudioId)} maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Majestic bus stand" /></label>
            <label className="space-y-2 text-sm font-medium">Category
              <Select disabled={mutation.isPending || Boolean(uploadedAudioId)} value={category} onValueChange={(value) => setCategory(value as AudioCategory)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><Textarea className="min-h-24 resize-none" disabled={mutation.isPending || Boolean(uploadedAudioId)} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Help operators understand where and when to use this audio" /></label>
          {mutation.isPending ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/[0.06]" aria-live="polite">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-semibold"><LoaderCircle className="size-4 animate-spin text-violet-600" />{uploadStage}</span><span className="tabular-nums text-muted-foreground">{uploadedAudioId ? 'Almost done' : `${progress}%`}</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <div className={cn('audio-progress-bar h-full rounded-full bg-violet-600 transition-[width] duration-500 ease-out', uploadedAudioId && 'audio-progress-processing')} style={{ width: `${uploadedAudioId ? 100 : Math.max(progress, 4)}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Keep this window open while we securely upload and check your file.</p>
            </div>
          ) : null}
          {uploadedAudioId && mutation.isError ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">Your file is uploaded. Retry verification to make it available in the audio library.</p> : null}
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-emerald-600" /><span>Files are securely uploaded and validated before they become available.</span></div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background/95 px-5 py-4 backdrop-blur sm:px-7">
          <Button className="h-11" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 min-w-36 bg-violet-600 hover:bg-violet-700" disabled={!file || !title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <CloudUpload />} {uploadedAudioId ? 'Retry verification' : 'Upload audio'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AudioLibrary({ audios, loading }: { audios: AnnouncementAudio[]; loading: boolean }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | AudioCategory>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementAudio | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

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
  const archiveMutation = useMutation({
    mutationFn: archiveAudio,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: announcementKeys.audios }); toast.success('Audio archived') },
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (loading) return <LoadingState />

  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="space-y-6 border-b px-5 py-6 sm:px-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><CardTitle className="text-xl tracking-tight">Audio library</CardTitle><p className="mt-1.5 text-sm leading-6 text-muted-foreground">One organized home for every reusable passenger announcement.</p></div>
          {can('announcements', 'audios', 'upload') ? <Button className="h-11 w-full bg-violet-600 shadow-md shadow-violet-600/15 hover:bg-violet-700 sm:w-auto" onClick={() => setUploadOpen(true)}><CloudUpload /> Upload audio</Button> : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 rounded-xl bg-background pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, file name, or description" /></div>
          <Select value={category} onValueChange={(value) => setCategory(value as 'all' | AudioCategory)}><SelectTrigger className="h-11 rounded-xl sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-7">
        {filtered.length ? <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{filtered.map((audio) => (
          <div key={audio.id} className="audio-card group flex min-w-0 flex-col rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/5 sm:p-5 dark:hover:border-violet-500/30">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 transition-transform duration-300 group-hover:scale-105 dark:bg-violet-500/15 dark:text-violet-300"><Headphones className="size-5" /></div>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold tracking-tight">{audio.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{audio.originalFileName}</p></div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', audio.status === 'ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : audio.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800')}>{audio.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-lg bg-muted px-2.5 py-1.5 font-medium">{categoryLabels[audio.category]}</span><span className="text-muted-foreground">{formatBytes(audio.sizeBytes)}</span>{formatDuration(audio.durationMs) ? <><span className="text-border">•</span><span className="text-muted-foreground">{formatDuration(audio.durationMs)}</span></> : null}</div>
            <p className="mt-4 min-h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">{audio.description || 'No description added.'}</p>
            <audio className="audio-player mt-5 h-10 w-full" controls preload="none" src={audio.downloadUrl ?? audio.blobUrl ?? undefined} />
            <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
              {can('announcements', 'audios', 'edit') ? <Button aria-label={`Edit ${audio.title}`} variant="ghost" className="h-10 px-3 text-muted-foreground hover:text-foreground" onClick={() => { setEditing(audio); setEditTitle(audio.title); setEditDescription(audio.description ?? '') }}><Pencil /><span>Edit</span></Button> : null}
              {can('announcements', 'audios', 'delete') ? <Button aria-label={`Archive ${audio.title}`} variant="ghost" className="h-10 px-3 text-muted-foreground hover:text-destructive" disabled={archiveMutation.isPending} onClick={() => window.confirm('Archive this audio? Routes already using it will keep their reference.') && archiveMutation.mutate(audio.id)}><Archive /><span>Archive</span></Button> : null}
            </div>
          </div>
        ))}</div> : <EmptyState icon={Music2} title="No audio found" description="Upload your first announcement or change the filters." />}
      </CardContent>
      {uploadOpen ? <AudioUploadDialog open onOpenChange={setUploadOpen} /> : null}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit audio details</DialogTitle><DialogDescription>Update the operator-facing name and description.</DialogDescription></DialogHeader><label className="space-y-1.5 text-sm font-medium">Title<Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label><label className="space-y-1.5 text-sm font-medium">Description<Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editTitle.trim() || editMutation.isPending} onClick={() => editMutation.mutate()}><Save /> Save changes</Button></DialogFooter></DialogContent></Dialog>
    </Card>
  )
}

function WelcomeSettings({ audios }: { audios: AnnouncementAudio[] }) {
  const settingsQuery = useQuery({ queryKey: announcementKeys.settings, queryFn: getSettings })
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null)
  const selectedId = selectedOverride ?? settingsQuery.data?.activeWelcomeAudioId ?? 'none'
  const mutation = useMutation({
    mutationFn: () => updateSettings(selectedId === 'none' ? null : selectedId),
    onSuccess: async () => { setSelectedOverride(null); await queryClient.invalidateQueries({ queryKey: announcementKeys.settings }); toast.success('Welcome note setting saved') },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const welcomeNotes = audios.filter((audio) => audio.category === 'welcome_note' && audio.status === 'ready')
  const selected = welcomeNotes.find((audio) => audio.id === selectedId)

  if (settingsQuery.isLoading) return <LoadingState />
  return (
    <Card className="audio-surface overflow-hidden rounded-2xl">
      <CardHeader className="border-b p-5 sm:p-7"><CardTitle className="text-xl tracking-tight">Passenger welcome note</CardTitle><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose the greeting passengers hear independently from each route's stop announcements.</p></CardHeader>
      <CardContent className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="space-y-6">
          <label className="space-y-2 text-sm font-medium">Active welcome note<Select value={selectedId} onValueChange={setSelectedOverride}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No welcome note</SelectItem>{welcomeNotes.map((audio) => <SelectItem key={audio.id} value={audio.id}>{audio.title}</SelectItem>)}</SelectContent></Select></label>
          <div className="flex gap-3 rounded-2xl border bg-muted/30 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-violet-600" /><p className="text-sm leading-6 text-muted-foreground">Welcome notes stay separate from route playlists, so they cannot be assigned to a stop by mistake.</p></div>
          <Button className="h-11 w-full sm:w-auto" disabled={mutation.isPending || selectedId === (settingsQuery.data?.activeWelcomeAudioId ?? 'none')} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save setting</Button>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-violet-50/70 to-sky-50/50 p-5 dark:from-violet-500/[0.08] dark:to-sky-500/[0.04]"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Now playing preview</p>{selected ? <div className="mt-5"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/20"><Music2 className="size-5" /></div><div className="min-w-0"><p className="truncate font-semibold">{selected.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(selected.sizeBytes)}</p></div></div><audio className="audio-player mt-6 h-10 w-full" controls preload="none" src={selected.downloadUrl ?? selected.blobUrl ?? undefined} /></div> : <p className="mt-6 text-sm leading-6 text-muted-foreground">No welcome note selected. Choose one to preview it here.</p>}</div>
      </CardContent>
    </Card>
  )
}

export function AudioAppPage() {
  const { can } = usePermissions()
  const canViewRoutes = can('announcements', 'routes', 'view')
  const canViewAudios = can('announcements', 'audios', 'view')
  const canEditSettings = can('announcements', 'settings', 'edit')
  const canViewMobileUsers = can('announcements', 'mobile_users', 'view')
  const availableTabs = useMemo(() => [
    canViewRoutes ? { id: 'routes' as const, label: 'Routes', description: 'Build stop playlists', icon: MapPinned } : null,
    canViewAudios ? { id: 'audios' as const, label: 'Audio library', description: 'Upload and organize', icon: Headphones } : null,
    canEditSettings ? { id: 'settings' as const, label: 'Welcome note', description: 'Set the greeting', icon: Settings2 } : null,
    canViewMobileUsers ? { id: 'mobile-users' as const, label: 'Driver users', description: 'Control mobile access', icon: UsersRound } : null,
  ].filter((tab): tab is NonNullable<typeof tab> => Boolean(tab)), [canEditSettings, canViewAudios, canViewMobileUsers, canViewRoutes])
  const [tab, setTab] = useState<Tab>(availableTabs[0]?.id ?? 'routes')
  const audiosQuery = useQuery({ queryKey: announcementKeys.audios, queryFn: listAudios, enabled: canViewAudios || canViewRoutes || canEditSettings })
  const audios = audiosQuery.data?.items ?? []
  const routesQuery = useQuery({ queryKey: announcementKeys.routes, queryFn: listRoutes, enabled: canViewRoutes })
  const published = routesQuery.data?.items.filter((route) => route.status === 'published').length ?? 0
  const ready = audios.filter((audio) => audio.status === 'ready').length

  return (
    <section className="audio-app-page mx-auto max-w-[1600px] space-y-7 pb-8">
      <PageGradientHeader eyebrow="Announcement management" title="Audio App" description="Create calm, consistent passenger journeys with organized audio and thoughtfully ordered route playlists." accent="violet" actions={<Button className="h-10" variant="outline" onClick={() => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.info('Refreshing announcement data') }}><RefreshCw /> Refresh</Button>} />
      <Card className="audio-surface overflow-hidden rounded-2xl" aria-label="Audio app summary">
        <CardContent className="grid p-0 sm:grid-cols-3">
          <div className="flex min-h-28 items-center gap-4 border-b p-5 sm:border-b-0 sm:border-r sm:p-6"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><MapPinned className="size-5" /></div><div><p className="text-2xl font-semibold tracking-tight">{routesQuery.data?.pagination.total ?? '—'}</p><p className="mt-0.5 text-sm text-muted-foreground">Configured routes</p></div></div>
          <div className="flex min-h-28 items-center gap-4 border-b p-5 sm:border-b-0 sm:border-r sm:p-6"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckCircle2 className="size-5" /></div><div><p className="text-2xl font-semibold tracking-tight">{canViewRoutes ? published : '—'}</p><p className="mt-0.5 text-sm text-muted-foreground">Published journeys</p></div></div>
          <div className="flex min-h-28 items-center gap-4 p-5 sm:p-6"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"><Headphones className="size-5" /></div><div><p className="text-2xl font-semibold tracking-tight">{ready}</p><p className="mt-0.5 text-sm text-muted-foreground">Audio files ready</p></div></div>
        </CardContent>
      </Card>
      <div className="audio-tabs -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Audio app sections">
        {availableTabs.map(({ id, label, description, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('group flex min-h-16 min-w-[180px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', tab === id ? 'border-violet-300 bg-violet-50 text-violet-950 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-50' : 'bg-card text-muted-foreground hover:border-violet-200 hover:bg-muted/30')}><span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors', tab === id ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground group-hover:text-foreground')}><Icon className="size-4" /></span><span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-0.5 block text-xs">{description}</span></span></button>)}
      </div>
      {audiosQuery.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Unable to load audio: {errorMessage(audiosQuery.error)}</div> : null}
      {tab === 'routes' && canViewRoutes ? <RoutesWorkspace audios={audios} /> : null}
      {tab === 'audios' && canViewAudios ? <AudioLibrary audios={audios} loading={audiosQuery.isLoading} /> : null}
      {tab === 'settings' && canEditSettings ? <WelcomeSettings audios={audios} /> : null}
      {tab === 'mobile-users' && canViewMobileUsers ? <MobileUsersPanel /> : null}
    </section>
  )
}
