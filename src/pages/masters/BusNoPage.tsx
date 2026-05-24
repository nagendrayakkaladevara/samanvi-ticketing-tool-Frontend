import { useState } from 'react'
import { BusFront, Fuel, Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MasterBusFormDialog } from '@/features/master-buses/components/master-bus-form-dialog'
import { MasterBusesGrid } from '@/features/master-buses/components/master-buses-grid'
import { useMasterBusesQuery } from '@/features/master-buses/hooks/use-master-buses-query'
import type { MasterBus } from '@/features/master-buses/types/master-bus'
import { SpareTankFormDialog } from '@/features/spare-tanks/components/spare-tank-form-dialog'
import { SpareTanksGrid } from '@/features/spare-tanks/components/spare-tanks-grid'
import { useSpareTanksQuery } from '@/features/spare-tanks/hooks/use-spare-tanks-query'
import type { SpareTank } from '@/features/spare-tanks/types/spare-tank'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

type BusNoTab = 'normal' | 'spare'

type FormState =
  | { kind: 'closed' }
  | { kind: 'bus-create' }
  | { kind: 'bus-edit'; bus: MasterBus }
  | { kind: 'spare-create' }
  | { kind: 'spare-edit'; item: SpareTank }

export function BusNoPage() {
  const currentUser = useCurrentUser()
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR'

  const [activeTab, setActiveTab] = useState<BusNoTab>('normal')
  const [formState, setFormState] = useState<FormState>({ kind: 'closed' })

  const {
    data: buses = [],
    isLoading: isLoadingBuses,
    isFetching: isFetchingBuses,
    isError: isBusesError,
    error: busesError,
  } = useMasterBusesQuery()

  const {
    data: spareTanks = [],
    isLoading: isLoadingSpareTanks,
    isFetching: isFetchingSpareTanks,
    isError: isSpareTanksError,
    error: spareTanksError,
  } = useSpareTanksQuery()

  const isFetching = activeTab === 'normal' ? isFetchingBuses : isFetchingSpareTanks

  const openAddDialog = () => {
    if (activeTab === 'normal') {
      setFormState({ kind: 'bus-create' })
      return
    }
    setFormState({ kind: 'spare-create' })
  }

  const closeForm = () => setFormState({ kind: 'closed' })

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-500/10 via-background to-teal-500/10 p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bus No</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage fleet bus registrations and spare tank assignments from a single master view.
            </p>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !(activeTab === 'normal' ? isLoadingBuses : isLoadingSpareTanks) ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {canManage ? (
              <Button className="w-full sm:w-auto" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                {activeTab === 'normal' ? 'Add Bus' : 'Add Spare Tank'}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('normal')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'normal'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BusFront className="h-4 w-4" />
          Normal Bus
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('spare')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'spare'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Fuel className="h-4 w-4" />
          Spare Tank
        </button>
      </div>

      {activeTab === 'normal' ? (
        <MasterBusesGrid
          buses={buses}
          isLoading={isLoadingBuses}
          isError={isBusesError}
          error={busesError as Error | null}
          canManage={canManage}
          onAdd={canManage ? () => setFormState({ kind: 'bus-create' }) : undefined}
          onEdit={(bus) => setFormState({ kind: 'bus-edit', bus })}
        />
      ) : (
        <SpareTanksGrid
          spareTanks={spareTanks}
          isLoading={isLoadingSpareTanks}
          isError={isSpareTanksError}
          error={spareTanksError as Error | null}
          canManage={canManage}
          onAdd={canManage ? () => setFormState({ kind: 'spare-create' }) : undefined}
          onEdit={(item) => setFormState({ kind: 'spare-edit', item })}
        />
      )}

      <MasterBusFormDialog
        open={formState.kind === 'bus-create' || formState.kind === 'bus-edit'}
        mode={formState.kind === 'bus-edit' ? 'edit' : 'create'}
        editingBus={formState.kind === 'bus-edit' ? formState.bus : null}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      />

      <SpareTankFormDialog
        open={formState.kind === 'spare-create' || formState.kind === 'spare-edit'}
        mode={formState.kind === 'spare-edit' ? 'edit' : 'create'}
        editingItem={formState.kind === 'spare-edit' ? formState.item : null}
        onOpenChange={(open) => {
          if (!open) closeForm()
        }}
      />
    </section>
  )
}
