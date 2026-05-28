import { useEffect, useMemo } from 'react'
import { BusFront, Download, FileSpreadsheet, FileText, Fuel, Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MasterBusFormDialog } from '@/features/master-buses/components/master-bus-form-dialog'
import { MasterBusesGrid } from '@/features/master-buses/components/master-buses-grid'
import { useMasterBusesQuery } from '@/features/master-buses/hooks/use-master-buses-query'
import type { MasterBus } from '@/features/master-buses/types/master-bus'
import { downloadNormalBusesExcel } from '@/features/master-buses/utils/download-normal-buses-excel'
import { downloadNormalBusesPdf } from '@/features/master-buses/utils/download-normal-buses-pdf'
import { SpareTankFormDialog } from '@/features/spare-tanks/components/spare-tank-form-dialog'
import { SpareTanksGrid } from '@/features/spare-tanks/components/spare-tanks-grid'
import { useSpareTanksQuery } from '@/features/spare-tanks/hooks/use-spare-tanks-query'
import type { SpareTank } from '@/features/spare-tanks/types/spare-tank'
import { downloadSpareTanksExcel } from '@/features/spare-tanks/utils/download-spare-tanks-excel'
import { downloadSpareTanksPdf } from '@/features/spare-tanks/utils/download-spare-tanks-pdf'
import { usePermissions, useSubmoduleActions } from '@/hooks/use-permissions'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type BusNoTab = 'normal' | 'spare'

function parseBusNoTab(value: string | null): BusNoTab {
  return value === 'spare' ? 'spare' : 'normal'
}

export function BusNoPage() {
  const { has } = usePermissions()
  const canViewBus = has('masters', 'bus_number', 'view')
  const canViewSpare = has('masters', 'spare_tank', 'view')
  const busActions = useSubmoduleActions('masters', 'bus_number')
  const spareActions = useSubmoduleActions('masters', 'spare_tank')
  const { action, id, tab: tabParam, openDialog, closeDialog, setTabParam } = useMasterDialogParams()

  const activeTab = parseBusNoTab(tabParam)

  useEffect(() => {
    if (activeTab === 'normal' && !canViewBus && canViewSpare) {
      setTabParam('spare')
    } else if (activeTab === 'spare' && !canViewSpare && canViewBus) {
      setTabParam('normal')
    }
  }, [activeTab, canViewBus, canViewSpare, setTabParam])

  const tabActions = activeTab === 'normal' ? busActions : spareActions

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

  const editingBus = useMemo(
    () => (action === 'edit' && id ? buses.find((bus) => bus.id === id) ?? null : null),
    [action, id, buses],
  )

  const editingSpareTank = useMemo(
    () => (action === 'edit' && id ? spareTanks.find((item) => item.id === id) ?? null : null),
    [action, id, spareTanks],
  )

  const isBusFormOpen =
    activeTab === 'normal' && (action === 'create' || (action === 'edit' && Boolean(editingBus)))
  const isSpareFormOpen =
    activeTab === 'spare' && (action === 'create' || (action === 'edit' && Boolean(editingSpareTank)))

  const isFetching = activeTab === 'normal' ? isFetchingBuses : isFetchingSpareTanks
  const isLoading = activeTab === 'normal' ? isLoadingBuses : isLoadingSpareTanks

  const exportCount = useMemo(
    () => (activeTab === 'normal' ? buses.length : spareTanks.length),
    [activeTab, buses.length, spareTanks.length],
  )

  const handleDownloadExcel = async () => {
    if (activeTab === 'normal') {
      if (buses.length === 0) {
        toast.error('No normal buses to export.')
        return
      }
      try {
        await downloadNormalBusesExcel(buses)
        toast.success('Normal buses list downloaded as Excel.')
      } catch {
        toast.error('Failed to download Excel file.')
      }
      return
    }

    if (spareTanks.length === 0) {
      toast.error('No spare tanks to export.')
      return
    }
    try {
      await downloadSpareTanksExcel(spareTanks)
      toast.success('Spare tanks list downloaded as Excel.')
    } catch {
      toast.error('Failed to download Excel file.')
    }
  }

  const handleDownloadPdf = () => {
    if (activeTab === 'normal') {
      if (buses.length === 0) {
        toast.error('No normal buses to export.')
        return
      }
      try {
        downloadNormalBusesPdf(buses)
        toast.success('Normal buses list downloaded as PDF.')
      } catch {
        toast.error('Failed to download PDF file.')
      }
      return
    }

    if (spareTanks.length === 0) {
      toast.error('No spare tanks to export.')
      return
    }
    try {
      downloadSpareTanksPdf(spareTanks)
      toast.success('Spare tanks list downloaded as PDF.')
    } catch {
      toast.error('Failed to download PDF file.')
    }
  }

  const openBusCreate = () => openDialog({ action: 'create', tab: 'normal' })
  const openBusEdit = (bus: MasterBus) => openDialog({ action: 'edit', id: bus.id, tab: 'normal' })
  const openSpareCreate = () => openDialog({ action: 'create', tab: 'spare' })
  const openSpareEdit = (item: SpareTank) => openDialog({ action: 'edit', id: item.id, tab: 'spare' })

  const openAddDialog = () => {
    if (activeTab === 'normal') {
      openBusCreate()
      return
    }
    openSpareCreate()
  }

  const exportsDisabled = isLoading || exportCount === 0

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
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {tabActions.canCreate ? (
              <Button className="w-full sm:w-auto" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                {activeTab === 'normal' ? 'Add Bus' : 'Add Spare Tank'}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex w-full items-center gap-2 sm:justify-between">
        <div className="inline-flex min-w-0 flex-1 rounded-xl border border-border bg-muted/30 p-1 sm:flex-none">
          {canViewBus ? (
            <button
              type="button"
              onClick={() => setTabParam('normal')}
              className={cn(
                'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:gap-2 sm:px-4',
                activeTab === 'normal'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BusFront className="h-4 w-4 shrink-0" />
              <span className="truncate">Normal Bus</span>
            </button>
          ) : null}
          {canViewSpare ? (
            <button
              type="button"
              onClick={() => setTabParam('spare')}
              className={cn(
                'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:gap-2 sm:px-4',
                activeTab === 'spare'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Fuel className="h-4 w-4 shrink-0" />
              <span className="truncate">Spare Tank</span>
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 sm:hidden"
              disabled={exportsDisabled}
              aria-label="Export options"
            >
              <Download className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled={exportsDisabled} onClick={handleDownloadExcel}>
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Download Excel
            </DropdownMenuItem>
            <DropdownMenuItem disabled={exportsDisabled} onClick={handleDownloadPdf}>
              <FileText className="h-4 w-4" aria-hidden />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDownloadExcel}
                  disabled={exportsDisabled}
                  aria-label={
                    activeTab === 'normal' ? 'Download normal buses as Excel' : 'Download spare tanks as Excel'
                  }
                >
                  <FileSpreadsheet className="h-4 w-4" aria-hidden />
                  Download Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {activeTab === 'normal' ? 'Download normal buses as Excel' : 'Download spare tanks as Excel'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDownloadPdf}
                  disabled={exportsDisabled}
                  aria-label={
                    activeTab === 'normal' ? 'Download normal buses as PDF' : 'Download spare tanks as PDF'
                  }
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Download PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {activeTab === 'normal' ? 'Download normal buses as PDF' : 'Download spare tanks as PDF'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {activeTab === 'normal' && canViewBus ? (
        <MasterBusesGrid
          buses={buses}
          isLoading={isLoadingBuses}
          isError={isBusesError}
          error={busesError as Error | null}
          canEdit={busActions.canEdit}
          canDelete={busActions.canDelete}
          onAdd={busActions.canCreate ? openBusCreate : undefined}
          onEdit={openBusEdit}
        />
      ) : null}
      {activeTab === 'spare' && canViewSpare ? (
        <SpareTanksGrid
          spareTanks={spareTanks}
          isLoading={isLoadingSpareTanks}
          isError={isSpareTanksError}
          error={spareTanksError as Error | null}
          canEdit={spareActions.canEdit}
          canDelete={spareActions.canDelete}
          onAdd={spareActions.canCreate ? openSpareCreate : undefined}
          onEdit={openSpareEdit}
        />
      ) : null}

      <MasterBusFormDialog
        open={isBusFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingBus={editingBus}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <SpareTankFormDialog
        open={isSpareFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingItem={editingSpareTank}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />
    </section>
  )
}
