type AgGridReactProps = {
  rowData?: unknown[]
}

export function AgGridReact({ rowData }: AgGridReactProps) {
  return (
    <div data-testid="ag-grid" data-row-count={rowData?.length ?? 0}>
      AG Grid
    </div>
  )
}
