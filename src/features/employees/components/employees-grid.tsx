import { useMemo, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AlertTriangle, Eye, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

export type EmployeeMobileField<T> = {
  label: string
  getValue: (item: T) => ReactNode
}

export type EmployeesGridProps<T extends { id: string }> = {
  items: T[]
  dataColumnDefs: ColDef<T>[]
  mobileBadge: (item: T) => ReactNode
  mobileFields: EmployeeMobileField<T>[]
  /** Optional title for the shared mobile card header (defaults to first field value). */
  getMobileTitle?: (item: T) => ReactNode
  /** Optional subtitle shown under the mobile card title. */
  getMobileSubtitle?: (item: T) => ReactNode
  /** When true, the first mobile field is omitted from the meta grid (use when it is the title). */
  omitFirstMobileField?: boolean
  /** Fully custom mobile card renderer; when set, default mobile cards are skipped. */
  renderMobileCard?: (item: T, index: number) => ReactNode
  /** Custom mobile loading skeleton; when set, replaces the default skeleton list. */
  renderMobileSkeleton?: () => ReactNode
  isLoading: boolean
  isError: boolean
  error: Error | null
  emptyIcon: ReactNode
  emptyTitle: string
  emptyDescription: string
  canEdit?: boolean
  canDelete?: boolean
  onView: (item: T) => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onAdd?: () => void
  emptyAddLabel?: string
  skeletonColumnCount?: number
}

function TableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <div className="ticket-grid-skeleton">
      <div className="ticket-grid-skeleton__header">
        {Array.from({ length: columnCount }).map((_, index) => (
          <Skeleton key={index} className="ticket-grid-skeleton__header-cell" />
        ))}
      </div>
      <div className="ticket-grid-skeleton__body">
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <div key={rowIdx} className="ticket-grid-skeleton__row" style={{ animationDelay: `${rowIdx * 60}ms` }}>
            {Array.from({ length: columnCount }).map((_, colIdx) => (
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

function EmptyState({
  icon,
  title,
  description,
  onAdd,
  addLabel = 'Add Record',
}: {
  icon: ReactNode
  title: string
  description: string
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="ticket-grid-empty">
      <div className="ticket-grid-empty__icon-wrapper">{icon}</div>
      <h3 className="ticket-grid-empty__title">{title}</h3>
      <p className="ticket-grid-empty__description">{description}</p>
      {onAdd ? (
        <Button className="mt-2" onClick={onAdd}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  )
}

function MobileActionButtons<T>({
  item,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
}: {
  item: T
  canEdit?: boolean
  canDelete?: boolean
  onView: (item: T) => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}) {
  return (
    <div className="ticket-mobile-card__actions">
      <Button size="sm" className="ticket-mobile-card__action-primary flex-1" onClick={() => onView(item)}>
        <Eye className="h-4 w-4" />
        View
      </Button>
      {canEdit ? (
        <Button
          variant="outline"
          size="sm"
          className="ticket-mobile-card__action-secondary flex-1"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          variant="destructive"
          size="sm"
          className="ticket-mobile-card__action-delete shrink-0 border-red-600 bg-red-600 text-white hover:bg-red-700"
          onClick={() => onDelete(item)}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

export function EmployeesGrid<T extends { id: string }>({
  items,
  dataColumnDefs,
  mobileBadge,
  mobileFields,
  getMobileTitle,
  getMobileSubtitle,
  omitFirstMobileField = false,
  renderMobileCard,
  renderMobileSkeleton,
  isLoading,
  isError,
  error,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  onAdd,
  emptyAddLabel,
  skeletonColumnCount = 7,
}: EmployeesGridProps<T>) {
  const isDarkMode = useDarkMode()
  const visibleMobileFields = omitFirstMobileField ? mobileFields.slice(1) : mobileFields

  const columnDefs = useMemo<Array<ColDef<T>>>(
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
      ...dataColumnDefs,
      {
        headerName: '',
        field: 'id' as ColDef<T>['field'],
        headerClass: 'ticket-grid__header-cell ticket-grid__header-cell--actions',
        cellClass: 'ticket-grid__actions-cell',
        minWidth: 280,
        maxWidth: 300,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<T>) => (
          <div className="flex items-center justify-end gap-2">
            {params.data ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="ticket-grid__action-btn"
                  onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation()
                    onView(params.data as T)
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                {canEdit ? (
                  <Button
                    size="sm"
                    className="ticket-grid__action-btn"
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation()
                      onEdit(params.data as T)
                    }}
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
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation()
                      onDelete(params.data as T)
                    }}
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
    [canDelete, canEdit, dataColumnDefs, onDelete, onEdit, onView],
  )

  const gridStyle: CSSProperties = {
    '--ag-font-family': 'inherit',
  } as CSSProperties

  if (isLoading) {
    return (
      <>
        <div className="ticket-mobile-list md:hidden">
          {renderMobileSkeleton
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>{renderMobileSkeleton()}</div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="ticket-mobile-card ticket-mobile-card--skeleton" aria-hidden>
                  <div className="ticket-mobile-card__header">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <dl className="ticket-mobile-card__meta">
                    <Skeleton className="h-10 rounded-md" />
                    <Skeleton className="h-10 rounded-md" />
                    <Skeleton className="ticket-mobile-card__meta-item--full h-10 rounded-md" />
                  </dl>
                  <div className="ticket-mobile-card__actions">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-10" />
                  </div>
                </Card>
              ))}
        </div>
        <div className="hidden md:block">
          <TableSkeleton columnCount={skeletonColumnCount} />
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <Card className="ticket-page__error">
        <AlertTriangle className="ticket-page__error-icon" />
        <div>
          <p className="ticket-page__error-title">Unable to load records</p>
          <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
        </div>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        onAdd={onAdd}
        addLabel={emptyAddLabel}
      />
    )
  }

  return (
    <>
      <div className="ticket-mobile-list md:hidden">
        {items.map((item, index) => {
          if (renderMobileCard) {
            return <div key={item.id}>{renderMobileCard(item, index)}</div>
          }

          const title =
            getMobileTitle?.(item) ??
            (mobileFields[0] ? mobileFields[0].getValue(item) : `Record ${index + 1}`)
          const subtitle = getMobileSubtitle?.(item)

          return (
            <Card key={item.id} className="ticket-mobile-card" role="article">
              <button type="button" className="ticket-mobile-card__body" onClick={() => onView(item)}>
                <div className="ticket-mobile-card__header">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="ticket-mobile-card__title">{title}</h3>
                    {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
                  </div>
                  {mobileBadge(item)}
                </div>
                <dl className="ticket-mobile-card__meta">
                  {visibleMobileFields.map((field, fieldIndex) => (
                    <div
                      key={field.label}
                      className={cn(
                        'ticket-mobile-card__meta-item',
                        fieldIndex === visibleMobileFields.length - 1 &&
                          visibleMobileFields.length % 2 === 1 &&
                          'ticket-mobile-card__meta-item--full',
                      )}
                    >
                      <dt>{field.label}</dt>
                      <dd>{field.getValue(item)}</dd>
                    </div>
                  ))}
                </dl>
              </button>
              <MobileActionButtons
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Card>
          )
        })}
      </div>

      <Card className="ticket-grid-wrapper hidden md:block">
        <div
          className={cn(isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'ticket-grid')}
          style={gridStyle}
        >
          <AgGridReact<T>
            rowData={items}
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
  )
}
