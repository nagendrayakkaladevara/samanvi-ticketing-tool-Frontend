import { useEffect } from 'react'

/** Scrolls the document to the top when dependencies change (e.g. route or filter). */
export function useScrollToTop(deps: readonly unknown[] = []) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, deps)
}
