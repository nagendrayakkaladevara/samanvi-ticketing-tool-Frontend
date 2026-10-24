import { CheckCircle2, LoaderCircle, RotateCcw, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RoutePlaylistEditor } from '../hooks/use-route-playlist-autosave'

export function PlaylistSaveStatus({ editor }: { editor: RoutePlaylistEditor }) {
  const { dirty, isSaving, error, conflict, saveNow, reloadRoute } = editor
  const title = error ? 'Changes could not be saved' : isSaving ? 'Saving changes…' : dirty ? 'Changes waiting to save' : 'All changes saved'
  const description = conflict
    ? 'This route changed elsewhere. Reload the latest route before editing again.'
    : error
      ? `Your edits are still here. ${error instanceof Error ? error.message : 'Check your connection and retry.'}`
      : dirty || isSaving
        ? 'Audio, order, and stop names save automatically after 2 seconds without edits.'
        : 'Your route playlist is up to date.'

  return (
    <div className={cn('sticky top-16 z-20 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between', error ? 'border-destructive/40' : dirty || isSaving ? 'border-primary/40' : 'border-emerald-500/30')}>
      <div role="status" aria-live="polite" aria-atomic="true" className="flex min-w-0 items-center gap-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', error ? 'bg-destructive/10 text-destructive' : dirty || isSaving ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : dirty ? <Save className="size-4" /> : <CheckCircle2 className="size-4" />}
        </span>
        <div className="min-w-0"><p className="text-sm font-semibold">{title}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{description}</p></div>
      </div>
      {conflict ? (
        <Button className="h-11 shrink-0" disabled={isSaving || editor.routeQuery.isFetching} onClick={() => {
          if (window.confirm('Reload the latest route? This discards your unsaved playlist edits.')) void reloadRoute()
        }}><RotateCcw /> Reload route</Button>
      ) : (
        <Button className="h-11 shrink-0" disabled={!dirty || isSaving} onClick={() => { void saveNow() }}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}{error ? 'Retry save' : 'Save now'}
        </Button>
      )}
    </div>
  )
}
