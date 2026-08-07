import { useMemo, type CSSProperties, type ComponentType, type MouseEvent, type ReactNode } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Eye, IdCard, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  EmployeeMobileCard,
  EmployeeMobileCardSkeleton,
  type EmployeeMobileField,
} from '@/features/employees/components/employee-mobile-card'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/features/tickets/styles/tickets-grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

export type { EmployeeMobileField }

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const mobileListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
}

const mobileItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
}

export type EmployeesGridProps<T extends { id: string }> = {
  items: T[]
  dataColumnDefs: ColDef<T>[]
  mobileBadge: (item: T) => ReactNode
  mobileFields: EmployeeMobileField<T>[]
  mobileMeta?: (item: T) => ReactNode
  mobileSectionTitle?: string
  mobileSectionIcon?: ComponentType<{ className?: string }>
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

export function EmployeesGrid<T extends { id: string }>({
  items,
  dataColumnDefs,
  mobileBadge,
  mobileFields,
  mobileMeta,
  mobileSectionTitle = 'Details',
  mobileSectionIcon = IdCard,
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
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animateMobile = isMobile && !shouldReduceMotion

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

  return (
    <>
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="employee-mobile-loading"
              className="employee-mobile-list"
              variants={animateMobile ? mobileListVariants : undefined}
              initial={animateMobile ? 'hidden' : false}
              animate={animateMobile ? 'visible' : undefined}
              exit={animateMobile ? 'exit' : undefined}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.div key={index} variants={animateMobile ? mobileItemVariants : undefined}>
                  <EmployeeMobileCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {!isLoading && !isError && items.length > 0 ? (
            <motion.div
              key="employee-mobile-data"
              className="employee-mobile-list"
              variants={animateMobile ? mobileListVariants : undefined}
              initial={animateMobile ? 'hidden' : false}
              animate={animateMobile ? 'visible' : undefined}
              exit={animateMobile ? 'exit' : undefined}
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={animateMobile ? mobileItemVariants : undefined}
                  layout={animateMobile}
                >
                  <EmployeeMobileCard
                    item={item}
                    index={index}
                    badge={mobileBadge(item)}
                    meta={mobileMeta?.(item)}
                    fields={mobileFields}
                    sectionTitle={mobileSectionTitle}
                    sectionIcon={mobileSectionIcon}
                    animationDelay={animateMobile ? index * 0.05 : 0}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="hidden md:block">
          <TableSkeleton columnCount={skeletonColumnCount} />
        </div>
      ) : null}

      {isError ? (
        <Card className="ticket-page__error">
          <AlertTriangle className="ticket-page__error-icon" />
          <div>
            <p className="ticket-page__error-title">Unable to load records</p>
            <p className="ticket-page__error-message">{error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          onAdd={onAdd}
          addLabel={emptyAddLabel}
        />
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
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
      ) : null}
    </>
  )
}
