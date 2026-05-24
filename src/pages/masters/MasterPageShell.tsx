import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type MasterPageShellProps = {
  title: string
  description?: string
}

export function MasterPageShell({ title, description }: MasterPageShellProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Master data management for {title.toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
