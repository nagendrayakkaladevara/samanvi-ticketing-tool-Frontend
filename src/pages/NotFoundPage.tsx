import { AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type NotFoundPageProps = {
  embedded?: boolean
}

export function NotFoundPage({ embedded = false }: NotFoundPageProps) {
  const navigate = useNavigate()
  const Wrapper = embedded ? 'section' : 'main'

  const handleGoBack = () => {
    const historyIndex = window.history.state?.idx
    if (typeof historyIndex === 'number' && historyIndex > 0) {
      navigate(-1)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <Wrapper className={`grid place-items-center px-4 py-10 ${embedded ? '' : 'min-h-screen'}`}>
      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
            <AlertCircle className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <CardTitle className="text-5xl font-bold tracking-tight">404</CardTitle>
          <p className="text-xl font-semibold">Page Not Found</p>
          <CardDescription>
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </Wrapper>
  )
}
