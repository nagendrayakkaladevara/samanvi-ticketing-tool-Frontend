import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, Inbox, Pencil, Trash2 } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { masterBusesService } from '@/features/master-buses/api/master-buses.service'
import {
  MasterDateCell,
  type MasterBusDateField,
} from '@/features/master-buses/components/master-date-display'
import {
  MasterBusMobileCard,
  MasterBusMobileCardSkeleton,
} from '@/features/master-buses/components/master-bus-mobile-card'
import type { MasterBus, MasterBusGridRow } from '@/features/master-buses/types/master-bus'
import { compareMasterBusesByNumber, toMasterBusGridRow } from '@/features/master-buses/utils/master-bus-model'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

function BusNumberCell({ value }: ICellRendererParams<MasterBusGridRow>) {
  return <span className="ticket-grid__bus-badge">{value}</span>
}

function ValidityDateCell({
  value,
  data,
  colDef,
}: ICellRendererParams<MasterBusGridRow, string> & { dateField?: MasterBusDateField }) {
  const dateField = (colDef?.cellRendererParams as { dateField?: MasterBusDateField } | undefined)?.dateField
  const rawDate = dateField && data ? (data[dateField] as string | null | undefined) : undefined
  const label = value ?? '—'

  return <MasterDateCell label={label} dateValue={rawDate} />
}

function validityDateColumn(
  labelField: keyof MasterBusGridRow,
  dateField: MasterBusDateField,
  headerName: string,
  minWidth: number,
): ColDef<MasterBusGridRow> {
  return {
    field: labelField,
    headerName,
    headerClass: 'ticket-grid__header-cell',
    cellRenderer: ValidityDateCell,
    cellRendererParams: { dateField },
    minWidth,
    flex: 1,
    sortable: true,
    filter: true,
  }
}

function RemarksCell({ value }: ICellRendererParams<MasterBusGridRow, string | null>) {
  const text = value?.trim() ? value.trim() : '—'
  if (!value?.trim()) {
    return <span className="text-muted-foreground">{text}</span>
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ticket-grid__title-text">{text}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="whitespace-pre-wrap">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function TableSkeleton() {
  return (
    <div className="ticket-grid-skeleton">
      <div className="ticket-grid-skeleton__header">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="ticket-grid-skeleton__header-cell" />
        ))}
      </div>
      <div className="ticket-grid-skeleton__body">
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <div key={rowIdx} className="ticket-grid-skeleton__row" style={{ animationDelay: `${rowIdx * 60}ms` }}>
            {Array.from({ length: 10 }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={`ticket-grid-skeleton__cell ${colIdx === 1 ? 'ticket-grid-skeleton__cell--wide' : ''}`}
              />
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
      <h3 className="ticket-grid-empty__title">No buses registered</h3>
      <p className="ticket-grid-empty__description">
        Add your first bus to manage fleet details, compliance dates, and spare tank assignments.
      </p>
      {canManage && onAdd ? (
        <Button className="mt-2" onClick={onAdd}>
          Add Bus
        </Button>
      ) : null}
    </div>
  )
}

type MasterBusesGridProps = {
  buses: MasterBus[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  canManage: boolean
  onAdd?: () => void
  onEdit: (bus: MasterBus) => void
}

export function MasterBusesGrid({
  buses,
  isLoading,
  isError,
  error,
  canManage,
  onAdd,
  onEdit,
}: MasterBusesGridProps) {
  const isDarkMode = useDarkMode()
  const [deleteTarget, setDeleteTarget] = useState<MasterBusGridRow | null>(null)

  const busById = useMemo(() => new Map(buses.map((bus) => [bus.id, bus])), [buses])

  const rowData = useMemo(
    () => [...buses].sort(compareMasterBusesByNumber).map(toMasterBusGridRow),
    [buses],
  )

  const deleteMutation = useMutation({
    mutationFn: (busId: string) => masterBusesService.remove(busId),
    onSuccess: () => {
      toast.success('Bus deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['master-buses'] })
      queryClient.invalidateQueries({ queryKey: ['master-bus-numbers'] })
      setDeleteTarget(null)
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete bus.')
    },
  })

  function openDeleteDialog(row: MasterBusGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    setDeleteTarget(row)
  }

  function openEditDialog(row: MasterBusGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const bus = busById.get(row.id)
    if (bus) onEdit(bus)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  const columnDefs = useMemo<Array<ColDef<MasterBusGridRow>>>(
    () => [
      {
        headerName: 'S.No',
        headerClass: 'ticket-grid__header-cell',
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        minWidth: 70,
        maxWidth: 90,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellClass: 'text-muted-foreground',
      },
      {
        field: 'busNumber',
        headerName: 'Bus No',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: BusNumberCell,
        width: 140,
        pinned: 'left',
        lockPinned: true,
        resizable: false,
        sortable: true,
        filter: true,
      },
      {
        field: 'engineNumber',
        headerName: 'Engine No',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 140,
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        field: 'chassisNumber',
        headerName: 'Chassis No',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 140,
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        field: 'purchaseDateLabel',
        headerName: 'Purchase Date',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 130,
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        field: 'odometer',
        headerName: 'Odometer',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 110,
        maxWidth: 130,
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          typeof params.value === 'number' ? params.value.toLocaleString() : String(params.value ?? '—'),
      },
      validityDateColumn('insuranceValidityLabel', 'insuranceValidity', 'Insurance', 130),
      validityDateColumn('pollutionValidityLabel', 'pollutionValidity', 'Pollution', 130),
      validityDateColumn('fcValidityLabel', 'fcValidity', 'FC', 120),
      validityDateColumn('basePermitValidityLabel', 'basePermitValidity', 'Base Permit', 130),
      validityDateColumn('homeTaxValidityLabel', 'homeTaxValidity', 'Home Tax', 130),
      validityDateColumn('aitpValidityLabel', 'aitpValidity', 'AITP', 120),
      validityDateColumn('aitpAuthorizationValidityLabel', 'aitpAuthorizationValidity', 'AITP Auth', 130),
      validityDateColumn('serviceOutDateLabel', 'serviceOutDate', 'Service Out', 130),
      {
        field: 'remarks',
        headerName: 'Remarks',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: RemarksCell,
        minWidth: 160,
        flex: 1.5,
        sortable: true,
        filter: true,
        valueFormatter: (params) => (params.value?.trim() ? params.value.trim() : '—'),
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
              cellRenderer: (params: ICellRendererParams<MasterBusGridRow>) => (
                <div className="flex items-center justify-end gap-2">
                  {params.data ? (
                    <>
                      <Button
                        size="sm"
                        className="ticket-grid__action-btn"
                        onClick={(event) => openEditDialog(params.data as MasterBusGridRow, event)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                        onClick={(event) => openDeleteDialog(params.data as MasterBusGridRow, event)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              ),
            } satisfies ColDef<MasterBusGridRow>,
          ]
        : []),
    ],
    [canManage, busById],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  return (
    <>
      {isLoading ? (
        <>
          <div className="master-bus-mobile-list md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <MasterBusMobileCardSkeleton key={index} />
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
            <p className="ticket-page__error-title">Failed to load buses</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? (
        <EmptyState onAdd={onAdd} canManage={canManage} />
      ) : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <>
          <div className="master-bus-mobile-list md:hidden">
            {rowData.map((row, index) => {
              const bus = busById.get(row.id)
              return (
                <div key={row.id} className="space-y-1">
                  <p className="px-1 text-xs text-muted-foreground">S.No {index + 1}</p>
                  <MasterBusMobileCard
                    row={row}
                    canManage={canManage && Boolean(bus)}
                    onEdit={bus ? () => onEdit(bus) : undefined}
                    onDelete={() => setDeleteTarget(row)}
                  />
                </div>
              )
            })}
          </div>

          <Card className="ticket-grid-wrapper hidden md:block">
            <div
              className={cn(
                isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz',
                'ticket-grid ticket-grid--bus-no',
              )}
              style={gridStyle}
            >
              <AgGridReact<MasterBusGridRow>
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
            <AlertDialogTitle>Delete bus?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove bus "${deleteTarget.busNumber}". Deletion is blocked if tickets or spare tanks still reference this bus.`
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
