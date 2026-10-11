import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Headphones, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type PlaybackAlert = {
  id: string; displayName: string; username: string; audioTitle: string;
  playCount: number; playedAt: string; readAt: string | null;
}
type AlertPage = { items: PlaybackAlert[]; total: number; unreadCount: number; page: number }
const key = ['announcements', 'playback-alerts'] as const

export function PlaybackAlerts() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const client = useQueryClient()
  const query = useQuery({
    queryKey: [...key, page],
    queryFn: async () => (await apiClient.get<{ data: AlertPage }>('/announcements/playback-alerts', { params: { page } })).data.data,
    refetchInterval: 15000,
  })
  const markRead = useMutation({
    mutationFn: async (id: string) => { await apiClient.patch(`/announcements/playback-alerts/${id}/read`) },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Could not mark the alert as read. Please try again.'),
  })
  const unread = query.data?.unreadCount ?? 0
  return <>
    <Button variant="outline" className={cn('relative h-11 gap-2', unread > 0 && 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100')} onClick={() => setOpen(true)} aria-label={query.isError ? 'Playback alerts unavailable. Open to retry.' : `Playback alerts, ${unread} unread`}>
      <span className="relative flex">
        {unread > 0 && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-amber-400/50 motion-safe:animate-ping" />}
        <Bell className="relative size-4" />
      </span>
      Alerts {unread > 0 && <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>}
      {query.isError && <span className="text-xs text-destructive">Unavailable</span>}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="size-5 text-amber-600" /> Repeat-play alerts</DialogTitle>
          <DialogDescription>{unread > 0 ? `${unread} unread alert${unread === 1 ? '' : 's'}` : 'All caught up'} · Drivers who played the same audio more than three consecutive times. Reading an alert acknowledges it for all admins.</DialogDescription>
        </DialogHeader>
        {query.isPending ? <p className="flex items-center gap-2 py-8 text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading alerts…</p> : query.isError ? <div role="alert" className="space-y-3 py-6"><p>Could not load playback alerts.</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <>
          {!query.data.items.length && <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground"><CheckCheck className="size-9" /><p>No repeat-play alerts yet.</p></div>}
          <div className="space-y-3">
            {query.data.items.map((alert) => <article key={alert.id} className={cn('rounded-xl border p-4', !alert.readAt && 'border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="break-words font-semibold">{alert.displayName} <span className="font-normal text-muted-foreground">(@{alert.username})</span></p>
                  <p className="flex items-start gap-2 text-sm"><Headphones className="mt-0.5 size-4 shrink-0 text-amber-600" /><span className="break-words">Played <strong>{alert.audioTitle}</strong> {alert.playCount} consecutive times.</span></p>
                  <p className="text-xs text-muted-foreground"><time dateTime={alert.playedAt}>{new Date(alert.playedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}</time></p>
                </div>
                {!alert.readAt && <span className="rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">New</span>}
              </div>
              <div className="mt-3 flex justify-end">
                {alert.readAt ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3" /> Read</span> : <Button size="sm" variant="outline" disabled={markRead.isPending} onClick={() => markRead.mutate(alert.id)}><Check className="size-3.5" /> Mark as read</Button>}
              </div>
            </article>)}
          </div>
          {query.data.total > 30 && <div className="flex items-center justify-between border-t pt-4"><Button variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(query.data.total / 30)}</span><Button variant="outline" disabled={page * 30 >= query.data.total || query.isFetching} onClick={() => setPage(page + 1)}>Next</Button></div>}
        </>}
      </DialogContent>
    </Dialog>
  </>
}
