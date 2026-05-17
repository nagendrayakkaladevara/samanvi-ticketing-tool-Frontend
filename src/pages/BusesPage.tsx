import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BusFront, Loader2, Plus, RefreshCw, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { busesService } from '@/features/buses/api/buses.service'
import { useBusesQuery } from '@/features/buses/hooks/use-buses-query'
import { queryClient } from '@/lib/query/query-client'

type BusFormValues = {
  busNumber: string
  lastMaintenanceDate: string
}

const defaultFormValues: BusFormValues = {
  busNumber: '',
  lastMaintenanceDate: '',
}

function formatDate(rawDate?: string): string {
  if (!rawDate) return 'Not set'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return 'Not set'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function toApiDate(dateInput: string): string | undefined {
  const trimmed = dateInput.trim()
  if (!trimmed) return undefined

  const parsed = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export function BusesPage() {
  const navigate = useNavigate()
  const { data: buses = [], isLoading, isFetching, isError, error } = useBusesQuery()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formValues, setFormValues] = useState<BusFormValues>(defaultFormValues)

  const sortedBuses = useMemo(
    () => [...buses].sort((a, b) => a.busNumber.localeCompare(b.busNumber, undefined, { numeric: true })),
    [buses],
  )

  const createMutation = useMutation({
    mutationFn: () =>
      busesService.create({
        busNumber: formValues.busNumber.trim(),
        ...(toApiDate(formValues.lastMaintenanceDate) ? { lastMaintenanceDate: toApiDate(formValues.lastMaintenanceDate) } : {}),
      }),
    onSuccess: () => {
      toast.success('Bus created successfully.')
      queryClient.invalidateQueries({ queryKey: ['buses'] })
      setIsCreateOpen(false)
      setFormValues(defaultFormValues)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to create bus.')
    },
  })

  const handleCreateBus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formValues.busNumber.trim()) {
      toast.error('Bus number is required.')
      return
    }
    createMutation.mutate()
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-500/10 via-background to-emerald-500/10 p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Fleet Registry</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Buses</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Keep a clean bus inventory for ticket linking and maintenance traceability.
            </p>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Bus
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </Card>
      ) : null}

      {isError ? (
        <Card className="space-y-2 p-5">
          <p className="font-semibold text-destructive">Unable to load buses</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedBuses.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <BusFront className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No buses available</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Start by creating your first bus. It will be available in ticket forms immediately.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create First Bus
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedBuses.length > 0 ? (
        <Card className="overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-4 py-3 font-medium">Bus Number</th>
                <th className="px-4 py-3 font-medium">Last Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuses.map((bus) => (
                <tr
                  key={bus.id}
                  className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/50"
                  onClick={() => navigate(`/buses/${bus.id}/tickets`, { state: { busNumber: bus.busNumber } })}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-medium">
                      <BusFront className="h-3.5 w-3.5 text-muted-foreground" />
                      {bus.busNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      {formatDate(bus.lastMaintenanceDate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create Bus</SheetTitle>
            <SheetDescription>Add a bus to make it available for ticket creation and fleet tracking.</SheetDescription>
          </SheetHeader>

          <form className="mt-6 space-y-4" onSubmit={handleCreateBus}>
            <div className="space-y-2">
              <Label htmlFor="busNumber">Bus Number</Label>
              <Input
                id="busNumber"
                value={formValues.busNumber}
                onChange={(event) => setFormValues((prev) => ({ ...prev, busNumber: event.target.value }))}
                placeholder="e.g., AP09AB1234"
                disabled={createMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastMaintenanceDate">Last Maintenance Date (optional)</Label>
              <Input
                id="lastMaintenanceDate"
                type="date"
                value={formValues.lastMaintenanceDate}
                onChange={(event) => setFormValues((prev) => ({ ...prev, lastMaintenanceDate: event.target.value }))}
                disabled={createMutation.isPending}
              />
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Bus
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  )
}
