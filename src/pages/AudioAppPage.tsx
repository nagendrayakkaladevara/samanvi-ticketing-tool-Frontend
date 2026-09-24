import { useMemo, useRef, useState } from 'react'
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
  Trash2,
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
import { Textarea } from '@/components/ui/textarea'
import {
  archiveAudio,
  archiveRoute,
  announcementKeys,
  createRoute,
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
import { usePermissions } from '@/hooks/use-permissions'
import { ApiError } from '@/lib/api/api-error'
import { queryClient } from '@/lib/query/query-client'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type Tab = 'routes' | 'audios' | 'settings'

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

function EmptyState({ icon: Icon, title, description }: { icon: typeof Music2; title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
      <div className="mb-3 rounded-full bg-muted p-3"><Icon className="size-6 text-muted-foreground" /></div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
      <LoaderCircle className="mr-2 size-5 animate-spin" /> Loading…
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
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-4">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div><CardTitle className="text-lg">Routes</CardTitle><p className="mt-1 text-xs text-muted-foreground">{routesQuery.data?.pagination.total ?? 0} configured</p></div>
            {canCreate ? <Button size="sm" onClick={() => { setEditingRoute(undefined); setFormOpen(true) }}><Plus /> New</Button> : null}
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes" /></div>
        </CardHeader>
        <CardContent className="max-h-[58vh] space-y-2 overflow-y-auto">
          {visibleRoutes.length ? visibleRoutes.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setPlaylistDraft(null) }} className={cn('w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/60', activeRouteId === item.id && 'border-violet-400 bg-violet-50/70 ring-1 ring-violet-300 dark:bg-violet-500/10')}>
              <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.routeCode}</p></div><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusStyles[item.status])}>{item.status}</span></div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span>{item.origin}</span><ArrowRight className="size-3" /><span>{item.destination}</span><span className="ml-auto">{item._count?.audios ?? 0} stops</span></div>
            </button>
          )) : <EmptyState icon={MapPinned} title="No routes found" description="Create a route or change your search." />}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        {routeQuery.isLoading ? <LoadingState /> : route ? (
          <>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><CardTitle>{route.name}</CardTitle><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusStyles[route.status])}>{route.status}</span></div><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPinned className="size-4" />{route.origin}<ArrowRight className="size-3" />{route.destination}<span>·</span>{route.routeCode}</p></div>
                <div className="flex flex-wrap gap-2">
                  {canEdit ? <Button variant="outline" size="sm" onClick={() => { setEditingRoute(route); setFormOpen(true) }}><Pencil /> Edit</Button> : null}
                  {canEdit ? <Button variant="outline" size="sm" disabled={routeStatusMutation.isPending} onClick={() => routeStatusMutation.mutate(route.status === 'published' ? 'draft' : 'published')}><CheckCircle2 />{route.status === 'published' ? 'Unpublish' : 'Publish'}</Button> : null}
                  {canDelete ? <Button variant="outline" size="sm" className="text-destructive" disabled={archiveMutation.isPending} onClick={() => window.confirm('Archive this route?') && archiveMutation.mutate()}><Archive /> Archive</Button> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-4">
                <label className="min-w-56 flex-1 space-y-1.5 text-sm font-medium">Add stop announcement
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={selectedAudioId} onChange={(event) => setSelectedAudioId(event.target.value)} disabled={!canAssign}>
                    <option value="">Select an available audio</option>
                    {readyStops.map((audio) => <option key={audio.id} value={audio.id}>{audio.title}</option>)}
                  </select>
                </label>
                <Button variant="outline" disabled={!selectedAudioId || !canAssign} onClick={addAudio}><CirclePlus /> Add to route</Button>
              </div>

              {playlist.length ? <div className="space-y-3">{playlist.map((item, index) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{index + 1}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.audio.title}</p><Input className="mt-2 h-8" value={item.stopLabel ?? ''} disabled={!canAssign} placeholder="Optional stop label" onChange={(event) => { const value = event.target.value; setPlaylistDraft((current) => (current ?? playlist).map((row, rowIndex) => rowIndex === index ? { ...row, stopLabel: value } : row)) }} /></div>
                  <audio className="h-8 w-full max-w-52" controls preload="none" src={item.audio.blobUrl} />
                  {canAssign ? <div className="flex gap-1">
                    <Button aria-label="Move up" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveAudio(index, -1)}><ArrowUp /></Button>
                    <Button aria-label="Move down" variant="ghost" size="icon" disabled={index === playlist.length - 1} onClick={() => moveAudio(index, 1)}><ArrowDown /></Button>
                    <Button aria-label="Remove audio" variant="ghost" size="icon" className="text-destructive" onClick={() => setPlaylistDraft((current) => (current ?? playlist).filter((_, rowIndex) => rowIndex !== index))}><Trash2 /></Button>
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AudioCategory>('stop_announcement')
  const [progress, setProgress] = useState(0)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose an audio file')
      await uploadAudio({ file, title, description, category, onProgress: setProgress })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.audios })
      toast.success('Audio uploaded and processing started')
      onOpenChange(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  function chooseFile(next: File | undefined) {
    if (!next) return
    if (next.size > 50 * 1024 * 1024) { toast.error('Audio must be 50 MB or smaller'); return }
    setFile(next)
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload audio</DialogTitle><DialogDescription>Add an MP3, M4A, AAC, WAV, or OGG file up to 50 MB.</DialogDescription></DialogHeader>
        <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 px-5 text-center hover:bg-muted/40">
          <CloudUpload className="mb-2 size-7 text-violet-600" /><span className="font-medium">{file ? file.name : 'Choose an audio file'}</span><span className="mt-1 text-xs text-muted-foreground">{file ? formatBytes(String(file.size)) : 'Click to browse'}</span>
        </button>
        <input ref={inputRef} className="hidden" type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg" onChange={(event) => chooseFile(event.target.files?.[0])} />
        <label className="space-y-1.5 text-sm font-medium">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Majestic bus stand" /></label>
        <label className="space-y-1.5 text-sm font-medium">Category<select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as AudioCategory)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1.5 text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Where or when this audio should be used" /></label>
        {mutation.isPending ? <div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="text-right text-xs text-muted-foreground">{progress}%</p></div> : null}
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!file || !title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <CloudUpload />} Upload audio</Button></DialogFooter>
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
    return matchesCategory && (!term || [audio.title, audio.fileName, audio.description ?? ''].some((value) => value.toLowerCase().includes(term)))
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
    <Card>
      <CardHeader className="space-y-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Audio library</CardTitle><p className="mt-1 text-sm text-muted-foreground">Upload once and reuse stop announcements across routes.</p></div>{can('announcements', 'audios', 'upload') ? <Button onClick={() => setUploadOpen(true)}><CloudUpload /> Upload audio</Button> : null}</div>
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search audio" /></div><select className="h-9 rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as 'all' | AudioCategory)}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </CardHeader>
      <CardContent className="pt-6">
        {filtered.length ? <div className="grid gap-4 lg:grid-cols-2">{filtered.map((audio) => (
          <div key={audio.id} className="rounded-xl border p-4">
            <div className="flex items-start gap-3"><div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"><Headphones className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{audio.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{audio.fileName} · {formatBytes(audio.sizeBytes)}</p></div><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', audio.status === 'ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : audio.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800')}>{audio.status}</span></div>
            <div className="mt-3 flex items-center justify-between gap-2"><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{categoryLabels[audio.category]}</span><div className="flex gap-1">{can('announcements', 'audios', 'edit') ? <Button aria-label="Edit audio" variant="ghost" size="icon" onClick={() => { setEditing(audio); setEditTitle(audio.title); setEditDescription(audio.description ?? '') }}><Pencil /></Button> : null}{can('announcements', 'audios', 'delete') ? <Button aria-label="Archive audio" variant="ghost" size="icon" className="text-destructive" disabled={archiveMutation.isPending} onClick={() => window.confirm('Archive this audio? Routes already using it will keep their reference.') && archiveMutation.mutate(audio.id)}><Archive /></Button> : null}</div></div>
            {audio.description ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{audio.description}</p> : null}
            <audio className="mt-4 h-9 w-full" controls preload="none" src={audio.blobUrl} />
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
    <Card>
      <CardHeader className="border-b"><CardTitle>Welcome note</CardTitle><p className="text-sm text-muted-foreground">Choose the global greeting played independently of route stop announcements.</p></CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4"><label className="space-y-1.5 text-sm font-medium">Active welcome note<select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedId} onChange={(event) => setSelectedOverride(event.target.value)}><option value="none">No welcome note</option>{welcomeNotes.map((audio) => <option key={audio.id} value={audio.id}>{audio.title}</option>)}</select></label><p className="text-sm text-muted-foreground">Common audio and welcome notes stay separate from stop playlists, preventing accidental route assignment.</p><Button disabled={mutation.isPending || selectedId === (settingsQuery.data?.activeWelcomeAudioId ?? 'none')} onClick={() => mutation.mutate()}>{mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save setting</Button></div>
        <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>{selected ? <div className="mt-4"><div className="flex items-center gap-3"><div className="rounded-full bg-violet-100 p-3 text-violet-700"><Music2 /></div><div><p className="font-semibold">{selected.title}</p><p className="text-xs text-muted-foreground">{formatBytes(selected.sizeBytes)}</p></div></div><audio className="mt-5 h-9 w-full" controls preload="none" src={selected.blobUrl} /></div> : <p className="mt-4 text-sm text-muted-foreground">No welcome note selected.</p>}</div>
      </CardContent>
    </Card>
  )
}

export function AudioAppPage() {
  const { can } = usePermissions()
  const canViewRoutes = can('announcements', 'routes', 'view')
  const canViewAudios = can('announcements', 'audios', 'view')
  const canEditSettings = can('announcements', 'settings', 'edit')
  const availableTabs = useMemo(() => [
    canViewRoutes ? { id: 'routes' as const, label: 'Routes', icon: MapPinned } : null,
    canViewAudios ? { id: 'audios' as const, label: 'Audio Library', icon: Headphones } : null,
    canEditSettings ? { id: 'settings' as const, label: 'Welcome Note', icon: Settings2 } : null,
  ].filter((tab): tab is NonNullable<typeof tab> => Boolean(tab)), [canEditSettings, canViewAudios, canViewRoutes])
  const [tab, setTab] = useState<Tab>(availableTabs[0]?.id ?? 'routes')
  const audiosQuery = useQuery({ queryKey: announcementKeys.audios, queryFn: listAudios, enabled: canViewAudios || canViewRoutes || canEditSettings })
  const audios = audiosQuery.data?.items ?? []
  const routesQuery = useQuery({ queryKey: announcementKeys.routes, queryFn: listRoutes, enabled: canViewRoutes })
  const published = routesQuery.data?.items.filter((route) => route.status === 'published').length ?? 0
  const ready = audios.filter((audio) => audio.status === 'ready').length

  return (
    <section className="space-y-6">
      <PageGradientHeader eyebrow="Announcement management" title="Audio App" description="Build route playlists, maintain reusable audio, and control the passenger welcome note." accent="violet" actions={<Button variant="outline" onClick={() => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.info('Refreshing announcement data') }}><RefreshCw /> Refresh</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Routes</p><p className="mt-2 text-2xl font-semibold">{routesQuery.data?.pagination.total ?? '—'}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Published</p><p className="mt-2 text-2xl font-semibold text-emerald-600">{canViewRoutes ? published : '—'}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ready audio</p><p className="mt-2 text-2xl font-semibold text-violet-600">{ready}</p></div>
      </div>
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1" role="tablist" aria-label="Audio app sections">
        {availableTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors', tab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}><Icon className="size-4" />{label}</button>)}
      </div>
      {audiosQuery.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Unable to load audio: {errorMessage(audiosQuery.error)}</div> : null}
      {tab === 'routes' && canViewRoutes ? <RoutesWorkspace audios={audios} /> : null}
      {tab === 'audios' && canViewAudios ? <AudioLibrary audios={audios} loading={audiosQuery.isLoading} /> : null}
      {tab === 'settings' && canEditSettings ? <WelcomeSettings audios={audios} /> : null}
    </section>
  )
}
