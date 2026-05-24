import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, Fuel, Inbox, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { spareTanksService } from '@/features/spare-tanks/api/spare-tanks.service'
import type { SpareTank, SpareTankGridRow } from '@/features/spare-tanks/types/spare-tank'
import {
  compareSpareTanksByBusNumber,
  formatSpareTankUpdatedAt,
  toSpareTankGridRow,
} from '@/features/spare-tanks/utils/spare-tank-model'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

function BusNumberCell({ value }: ICellRendererParams<SpareTankGridRow>) {
  return <span className="ticket-grid__bus-badge">{value}</span>
}

function TableSkeleton() {
  return (
    <div className="ticket-grid-skeleton">
      <div className="ticket-grid-skeleton__header">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="ticket-grid-skeleton__header-cell" />
        ))}
      </div>
      <div className="ticket-grid-skeleton__body">
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div key={rowIdx} className="ticket-grid-skeleton__row" style={{ animationDelay: `${rowIdx * 60}ms` }}>
            {Array.from({ length: 4 }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="ticket-grid-skeleton__cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ onAdd, canManage }: { onAdd?: () => void; canManage: boolean }) {
  return (
    <div className="ticket-grid-empty">
      <div className="ticket-grid-empty__icon-wrapper">
        <Inbox className="ticket-grid-empty__icon" strokeWidth={1.2} />
      </div>
      <h3 className="ticket-grid-empty__title">No spare tanks registered</h3>
      <p className="ticket-grid-empty__description">
        Link spare tanks to existing buses and track owner details for fleet operations.
      </p>
      {canManage && onAdd ? (
        <Button className="mt-2" onClick={onAdd}>
          Add Spare Tank
        </Button>
      ) : null}
    </div>
  )
}

type SpareTanksGridProps = {
  spareTanks: SpareTank[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  canManage: boolean
  onAdd?: () => void
  onEdit: (item: SpareTank) => void
}

export function SpareTanksGrid({
  spareTanks,
  isLoading,
  isError,
  error,
  canManage,
  onAdd,
  onEdit,
}: SpareTanksGridProps) {
  const isDarkMode = useDarkMode()
  const [deleteTarget, setDeleteTarget] = useState<SpareTankGridRow | null>(null)

  const itemById = useMemo(() => new Map(spareTanks.map((item) => [item.id, item])), [spareTanks])

  const rowData = useMemo(
    () => [...spareTanks].sort(compareSpareTanksByBusNumber).map(toSpareTankGridRow),
    [spareTanks],
  )

  const deleteMutation = useMutation({
    mutationFn: (spareTankId: string) => spareTanksService.remove(spareTankId),
    onSuccess: () => {
      toast.success('Spare tank deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['spare-tanks'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete spare tank.')
    },
  })

  function openDeleteDialog(row: SpareTankGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setDeleteTarget(row)
  }

  function openEditDialog(row: SpareTankGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const item = itemById.get(row.id)
    if (item) onEdit(item)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const columnDefs = useMemo<Array<ColDef<SpareTankGridRow>>>(
    () => [
      {
        field: 'busNumber',
        headerName: 'Bus No',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: BusNumberCell,
        minWidth: 130,
        maxWidth: 160,
        sortable: true,
        filter: true,
      },
      {
        field: 'ownerName',
        headerName: 'Owner Name',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 180,
        flex: 1.5,
        sortable: true,
        filter: true,
      },
      {
        field: 'updatedAtLabel',
        headerName: 'Last Updated',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 150,
        flex: 1,
        sortable: true,
        filter: true,
      },
      ...(canManage
        ? [
            {
              headerName: '',
              field: 'id',
              headerClass: 'ticket-grid__header-cell ticket-grid__header-cell--actions',
              cellClass: 'ticket-grid__actions-cell',
              minWidth: 200,
              maxWidth: 220,
              sortable: false,
              filter: false,
              floatingFilter: false,
              cellRenderer: (params: ICellRendererParams<SpareTankGridRow>) => (
                <div className="flex items-center justify-end gap-2">
                  {params.data ? (
                    <>
                      <Button
                        size="sm"
                        className="ticket-grid__action-btn"
                        onClick={(event) => openEditDialog(params.data as SpareTankGridRow, event)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                        onClick={(event) => openDeleteDialog(params.data as SpareTankGridRow, event)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              ),
            } satisfies ColDef<SpareTankGridRow>,
          ]
        : []),
    ],
    [canManage, itemById],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  return (
    <>
      {isLoading ? (
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <div className="hidden md:block">
            <TableSkeleton />
          </div>
        </>
      ) : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Failed to load spare tanks</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? (
        <EmptyState onAdd={onAdd} canManage={canManage} />
      ) : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {rowData.map((row) => {
              const item = itemById.get(row.id)
              return (
                <Card key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium">
                        <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                        {row.busNumber}
                      </span>
                      <p className="text-sm font-medium">{row.ownerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatSpareTankUpdatedAt(item?.updatedAt)}
                      </p>
                    </div>
                    {canManage && item ? (
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="ticket-grid-wrapper hidden md:block">
            <div
              className={cn(isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'ticket-grid')}
              style={gridStyle}
            >
              <AgGridReact<SpareTankGridRow>
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                  floatingFilter: true,
                }}
                animateRows
                suppressCellFocus
                domLayout="autoHeight"
                rowHeight={52}
                headerHeight={44}
                floatingFiltersHeight={44}
              />
            </div>
          </Card>
        </>
      ) : null}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete spare tank?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove the spare tank linked to "${deleteTarget.busNumber}" (${deleteTarget.ownerName}).`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
