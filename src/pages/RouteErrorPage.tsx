import { AlertCircle } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RouteErrorPageProps = {
  embedded?: boolean
}

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    const data =
      typeof error.data === 'string'
        ? error.data
        : error.data && typeof error.data === 'object' && 'message' in error.data
          ? String((error.data as { message: unknown }).message)
          : undefined
    return data || error.statusText || `Error ${error.status}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred while loading this page.'
}

export function RouteErrorPage({ embedded = false }: RouteErrorPageProps) {
  const error = useRouteError()
  const message = getErrorMessage(error)
  const Wrapper = embedded ? 'section' : 'main'

  return (
    <Wrapper className={`grid place-items-center px-4 py-10 ${embedded ? '' : 'min-h-screen'}`}>
      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Something went wrong</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/garage/repair-tracking">Repair tracking</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Go to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </Wrapper>
  )
}
