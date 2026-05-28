import { Eye, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export type EmployeeTableColumn<T> = {
  key: string
  header: string
  className?: string
  render: (item: T, index: number) => React.ReactNode
}

type EmployeesTablePanelProps<T extends { id: string }> = {
  items: T[]
  columns: EmployeeTableColumn<T>[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyDescription: string
  onView: (item: T) => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  canEdit?: boolean
  canDelete?: boolean
  minWidth?: string
}

function ActionButtons<T>({
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
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => onView(item)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
      {canEdit ? (
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
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
          Delete
        </Button>
      ) : null}
    </div>
  )
}

export function EmployeesTablePanel<T extends { id: string }>({
  items,
  columns,
  isLoading,
  isError,
  error,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  minWidth = '960px',
}: EmployeesTablePanelProps<T>) {
  if (isLoading) {
    return (
      <>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Card className="hidden space-y-3 p-4 md:block">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </Card>
      </>
    )
  }

  if (isError) {
    return (
      <Card className="space-y-2 p-5">
        <p className="font-semibold text-destructive">Unable to load records</p>
        <p className="text-sm text-muted-foreground">{error?.message ?? 'Unexpected error occurred.'}</p>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        {emptyIcon}
        <h2 className="text-lg font-semibold">{emptyTitle}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="space-y-3">
              <div className="grid gap-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{column.header}</span>
                    <span className="max-w-[60%] text-right font-medium">{column.render(item, index)}</span>
                  </div>
                ))}
              </div>
              <ActionButtons
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b bg-muted/30 text-left">
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-medium ${column.className ?? ''}`}>
                  {column.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                    {column.render(item, index)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <ActionButtons
                    item={item}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
