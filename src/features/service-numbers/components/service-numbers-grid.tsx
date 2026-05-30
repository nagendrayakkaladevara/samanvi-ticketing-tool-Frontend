import { useMemo, type CSSProperties, type MouseEvent } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, Eye, Inbox, Pencil, Route, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ServiceNumber, ServiceNumberGridRow } from '@/features/service-numbers/types/service-number'
import {
  compareServiceNumbersByNo,
  toServiceNumberGridRow,
} from '@/features/service-numbers/utils/service-number-model'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

function ServiceNoCell({ value }: ICellRendererParams<ServiceNumberGridRow>) {
  return (
    <span className="ticket-grid__bus-badge inline-flex items-center gap-2">
      <Route className="h-3.5 w-3.5 text-muted-foreground" />
      {value}
    </span>
  )
}

function DesktopTableLoader() {
  return (
    <Card className="hidden space-y-3 p-4 md:block">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </Card>
  )
}

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="ticket-grid-empty">
      <div className="ticket-grid-empty__icon-wrapper">
        <Inbox className="ticket-grid-empty__icon" strokeWidth={1.2} />
      </div>
      <h3 className="ticket-grid-empty__title">No service numbers yet</h3>
      <p className="ticket-grid-empty__description">
        Create your first service number to define routes, fares, and crew beta amounts.
      </p>
      {onAdd ? (
        <Button className="mt-2" onClick={onAdd}>
          Add Service Number
        </Button>
      ) : null}
    </div>
  )
}

type ServiceNumbersGridProps = {
  items: ServiceNumber[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  canEdit?: boolean
  canDelete?: boolean
  onAdd?: () => void
  onView: (item: ServiceNumber) => void
  onEdit: (item: ServiceNumber) => void
  onDelete: (item: ServiceNumber) => void
}

export function ServiceNumbersGrid({
  items,
  isLoading,
  isError,
  error,
  canEdit = false,
  canDelete = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: ServiceNumbersGridProps) {
  const isDarkMode = useDarkMode()

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const rowData = useMemo(
    () => [...items].sort(compareServiceNumbersByNo).map(toServiceNumberGridRow),
    [items],
  )

  function openViewDialog(row: ServiceNumberGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const item = itemById.get(row.id)
    if (item) onView(item)
  }

  function openEditDialog(row: ServiceNumberGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const item = itemById.get(row.id)
    if (item) onEdit(item)
  }

  function openDeleteDialog(row: ServiceNumberGridRow, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    const item = itemById.get(row.id)
    if (item) onDelete(item)
  }

  const columnDefs = useMemo<Array<ColDef<ServiceNumberGridRow>>>(
    () => [
      {
        headerName: 'S.No',
        headerClass: 'ticket-grid__header-cell',
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        minWidth: 70,
        maxWidth: 90,
        pinned: 'left',
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellClass: 'text-muted-foreground',
      },
      {
        field: 'serviceNo',
        headerName: 'Service No',
        headerClass: 'ticket-grid__header-cell',
        cellRenderer: ServiceNoCell,
        minWidth: 140,
        maxWidth: 170,
        pinned: 'left',
        sortable: true,
        filter: true,
      },
      {
        field: 'serviceFor',
        headerName: 'Service For',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 140,
        flex: 1,
        sortable: true,
        filter: true,
      },
      {
        field: 'route',
        headerName: 'Route',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 180,
        flex: 1.5,
        sortable: true,
        filter: true,
      },
      {
        field: 'via',
        headerName: 'Via',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 120,
        flex: 1,
        sortable: true,
        filter: true,
        cellClass: 'text-muted-foreground',
      },
      {
        field: 'distanceLabel',
        headerName: 'Distance',
        headerClass: 'ticket-grid__header-cell',
        minWidth: 110,
        maxWidth: 130,
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
        cellClass: 'text-muted-foreground',
      },
      {
        headerName: '',
        field: 'id',
        headerClass: 'ticket-grid__header-cell ticket-grid__header-cell--actions',
        cellClass: 'ticket-grid__actions-cell',
        minWidth: 260,
        maxWidth: 280,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<ServiceNumberGridRow>) => (
          <div className="flex items-center justify-end gap-2">
            {params.data ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="ticket-grid__action-btn"
                  onClick={(event) => openViewDialog(params.data as ServiceNumberGridRow, event)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                {canEdit ? (
                  <Button
                    size="sm"
                    className="ticket-grid__action-btn"
                    onClick={(event) => openEditDialog(params.data as ServiceNumberGridRow, event)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                    onClick={(event) => openDeleteDialog(params.data as ServiceNumberGridRow, event)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [canEdit, canDelete, itemById],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  return (
    <>
      {isLoading ? (
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <DesktopTableLoader />
        </>
      ) : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Unable to load service numbers</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && rowData.length === 0 ? <EmptyState onAdd={onAdd} /> : null}

      {!isLoading && !isError && rowData.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {rowData.map((row, index) => {
              const item = itemById.get(row.id)
              return (
                <Card key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-xs text-muted-foreground">S.No {index + 1}</p>
                      <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm font-medium">
                        <Route className="h-3.5 w-3.5 text-muted-foreground" />
                        {row.serviceNo}
                      </span>
                      <p className="text-sm text-muted-foreground">{row.serviceFor}</p>
                      <p className="text-sm">{row.route}</p>
                      <p className="text-xs text-muted-foreground">
                        Via {row.via} · {row.distanceLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">Updated {row.updatedAtLabel}</p>
                    </div>
                    {item ? (
                      <div className="flex shrink-0 gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => onView(item)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canEdit ? (
                          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
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
              <AgGridReact<ServiceNumberGridRow>
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
    </>
  )
}
