import type { Location } from 'react-router-dom'

function isSafeRedirectPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

export function getPostLoginRedirect(location: Location): string {
  const redirectParam = new URLSearchParams(location.search).get('redirect')
  const fromState = (location.state as { from?: unknown } | null)?.from

  if (isSafeRedirectPath(redirectParam)) {
    return redirectParam
  }

  if (isSafeRedirectPath(fromState)) {
    return fromState
  }

  return '/'
}
