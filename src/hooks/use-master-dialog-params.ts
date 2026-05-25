import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export type MasterDialogAction = 'create' | 'edit' | 'view' | 'delete'

const VALID_ACTIONS = new Set<MasterDialogAction>(['create', 'edit', 'view', 'delete'])

function parseAction(value: string | null): MasterDialogAction | null {
  if (!value || !VALID_ACTIONS.has(value as MasterDialogAction)) {
    return null
  }
  return value as MasterDialogAction
}

type OpenDialogParams = {
  action: MasterDialogAction
  id?: string
  tab?: string
}

export function useMasterDialogParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const action = parseAction(searchParams.get('action'))
  const id = searchParams.get('id')
  const tab = searchParams.get('tab')

  const openDialog = useCallback(
    ({ action: nextAction, id: nextId, tab: nextTab }: OpenDialogParams) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('action', nextAction)
          if (nextId) {
            next.set('id', nextId)
          } else {
            next.delete('id')
          }
          if (nextTab) {
            next.set('tab', nextTab)
          }
          return next
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

  const closeDialog = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('action')
        next.delete('id')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const setTabParam = useCallback(
    (nextTab: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tab', nextTab)
          next.delete('action')
          next.delete('id')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return {
    action,
    id,
    tab,
    openDialog,
    closeDialog,
    setTabParam,
  }
}
