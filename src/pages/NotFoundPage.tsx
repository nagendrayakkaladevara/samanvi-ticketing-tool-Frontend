export function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Page Not Found</h1>
      <p className="text-sm text-muted-foreground">
        The route does not exist. Check `app/router/routes.tsx` for valid paths.
      </p>
    </section>
  )
}
