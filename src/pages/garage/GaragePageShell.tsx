import { PageGradientHeader } from '@/components/page-gradient-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type GaragePageShellProps = {
  title: string
  description?: string
}

export function GaragePageShell({ title, description }: GaragePageShellProps) {
  return (
    <section className="space-y-6">
      <PageGradientHeader
        accent="orange"
        eyebrow="Garage"
        title={title}
        description={description ?? `Garage management for ${title.toLowerCase()}.`}
      />
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Garage management for {title.toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Content coming soon.</p>
        </CardContent>
      </Card>
    </section>
  )
}
