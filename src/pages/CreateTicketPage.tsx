import { useEffect, type FormEventHandler } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useCreateTicketForm } from '@/features/tickets/hooks/use-create-ticket-form'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

const MIN_DESCRIPTION_WORDS_FOR_AI = 4

function RequiredBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
      Required
    </span>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium !text-red-600">{message}</p>
}

export function CreateTicketPage() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['issue-categories'],
    queryFn: () => ticketsService.listIssueCategories(),
  })
  const { data: assignableUsers = [], isLoading: isAssignableUsersLoading } = useQuery({
    queryKey: ['ticket-assignable-users'],
    queryFn: () => ticketsService.listAssignableUsers(),
  })

  const form = useCreateTicketForm()

  const createTicketMutation = useMutation({
    mutationFn: async (variables: { assignedToId: string }) => {
      const createdTicket = await ticketsService.create(form.payload)
      if (variables.assignedToId) {
        await ticketsService.assign({
          ticketId: createdTicket.id,
          assignedToId: variables.assignedToId,
        })
      }
      return createdTicket
    },
    onSuccess: (_, variables) => {
      toast.success(variables.assignedToId ? 'Ticket created and assigned successfully.' : 'Ticket created successfully.')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      form.resetForm()
      navigate('/tickets')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket.')
    },
  })

  const enhanceDescriptionMutation = useMutation({
    mutationFn: async (description: string) => ticketsService.enhanceDescription(description),
    onSuccess: (enhancedText) => {
      form.setField('description', enhancedText)
      toast.success('Description enhanced with AI.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to enhance description.')
    },
  })

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const nextErrors = form.validate()
    // #region agent log
    fetch('http://127.0.0.1:7927/ingest/54f1c9c3-dd97-451a-9825-8fa76e413742', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '016c02' },
      body: JSON.stringify({
        sessionId: '016c02',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'CreateTicketPage.tsx:handleSubmit:validate',
        message: 'Validation result on submit',
        data: {
          errorKeys: Object.keys(nextErrors),
          errorCount: Object.keys(nextErrors).length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (Object.keys(nextErrors).length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7927/ingest/54f1c9c3-dd97-451a-9825-8fa76e413742', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '016c02' },
        body: JSON.stringify({
          sessionId: '016c02',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'CreateTicketPage.tsx:handleSubmit:setErrors',
          message: 'Submit blocked due to validation errors',
          data: { willSetErrors: true },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      form.setErrors(nextErrors)
      toast.error('Please fill all required fields.')
      return
    }
    createTicketMutation.mutate({ assignedToId: form.values.assignedToId })
  }

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7927/ingest/54f1c9c3-dd97-451a-9825-8fa76e413742', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '016c02' },
      body: JSON.stringify({
        sessionId: '016c02',
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'CreateTicketPage.tsx:useEffect:errors',
        message: 'Error state changed',
        data: {
          errorKeys: Object.keys(form.errors),
          titleInvalid: Boolean(form.errors.title),
          descriptionInvalid: Boolean(form.errors.description),
          categoryInvalid: Boolean(form.errors.categoryId),
          busInvalid: Boolean(form.errors.busNumber),
          slaInvalid: Boolean(form.errors.slaDueAtLocal),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }, [form.errors])

  const handleEnhanceDescription = () => {
    const description = form.values.description.trim()
    const wordCount = description.split(/\s+/).filter(Boolean).length

    if (wordCount < MIN_DESCRIPTION_WORDS_FOR_AI) {
      toast.error(`Please enter at least ${MIN_DESCRIPTION_WORDS_FOR_AI} words in description to enhance with AI.`)
      return
    }

    enhanceDescriptionMutation.mutate(description)
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header className="space-y-2">
        <Button variant="ghost" className="-ml-3 w-fit" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create Ticket</h1>
        <p className="text-sm text-muted-foreground">
          Log a new issue with only essential details. Required fields are marked clearly.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
              <RequiredBadge />
            </Label>
            <Input
              id="title"
              placeholder="e.g., Engine overheating on route 42"
              className={cn(form.errors.title && '!border-red-600 !ring-1 !ring-red-500/30')}
              value={form.values.title}
              onChange={(event) => form.setField('title', event.target.value)}
              aria-invalid={Boolean(form.errors.title)}
              disabled={createTicketMutation.isPending}
            />
            <FieldError message={form.errors.title} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="description">
                Description
                <RequiredBadge />
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rainbow-glow-button ml-auto h-7 px-2 text-[11px]"
                onClick={handleEnhanceDescription}
                disabled={createTicketMutation.isPending || enhanceDescriptionMutation.isPending}
              >
                {enhanceDescriptionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Enhance with AI
              </Button>
            </div>
            <div className="relative">
              <Textarea
                id="description"
                placeholder="Briefly describe what happened and any observed impact."
                className={cn(
                  'min-h-28 pr-10',
                  form.errors.description && '!border-red-600 !ring-1 !ring-red-500/30',
                )}
                value={form.values.description}
                onChange={(event) => form.setField('description', event.target.value)}
                aria-invalid={Boolean(form.errors.description)}
                disabled={createTicketMutation.isPending || enhanceDescriptionMutation.isPending}
              />
              {enhanceDescriptionMutation.isPending ? (
                <Sparkles className="pointer-events-none absolute right-3 top-3 h-4 w-4 animate-pulse text-muted-foreground" />
              ) : null}
            </div>
            <FieldError message={form.errors.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity
                <RequiredBadge />
              </Label>
              <Select
                value={form.values.severity}
                onValueChange={(value) => form.setField('severity', value as 'critical' | 'high' | 'medium' | 'low')}
                disabled={createTicketMutation.isPending}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority
                <RequiredBadge />
              </Label>
              <Select
                value={form.values.priority}
                onValueChange={(value) => form.setField('priority', value as 'p1' | 'p2' | 'p3')}
                disabled={createTicketMutation.isPending}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">P1 - Urgent</SelectItem>
                  <SelectItem value="p2">P2 - Default</SelectItem>
                  <SelectItem value="p3">P3 - Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category
                <RequiredBadge />
              </Label>
              <Select
                value={form.values.categoryId}
                onValueChange={(value) => form.setField('categoryId', value)}
                disabled={createTicketMutation.isPending || isCategoriesLoading}
              >
                <SelectTrigger
                  id="categoryId"
                  aria-invalid={Boolean(form.errors.categoryId)}
                  className={cn(form.errors.categoryId && '!border-red-600 !ring-1 !ring-red-500/30')}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={form.errors.categoryId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="busNumber">
                Bus Number
                <RequiredBadge />
              </Label>
              <Input
                id="busNumber"
                placeholder="e.g., AP09AB1234"
                className={cn(form.errors.busNumber && '!border-red-600 !ring-1 !ring-red-500/30')}
                value={form.values.busNumber}
                onChange={(event) => form.setField('busNumber', event.target.value)}
                aria-invalid={Boolean(form.errors.busNumber)}
                disabled={createTicketMutation.isPending}
              />
              <FieldError message={form.errors.busNumber} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assignedToId">Assign To</Label>
              <Select
                value={form.values.assignedToId}
                onValueChange={(value) => form.setField('assignedToId', value)}
                disabled={createTicketMutation.isPending || isAssignableUsersLoading}
              >
                <SelectTrigger id="assignedToId">
                  <SelectValue placeholder="Select worker (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="slaDueAtLocal">
                SLA Due At
                <RequiredBadge />
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => form.applySuggestedSla(form.values.priority)}
                disabled={createTicketMutation.isPending}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Suggest for {form.values.priority.toUpperCase()}
              </Button>
            </div>
            <Input
              id="slaDueAtLocal"
              type="datetime-local"
              className={cn(form.errors.slaDueAtLocal && '!border-red-600 !ring-1 !ring-red-500/30')}
              value={form.values.slaDueAtLocal}
              onChange={(event) => form.setField('slaDueAtLocal', event.target.value)}
              aria-invalid={Boolean(form.errors.slaDueAtLocal)}
              disabled={createTicketMutation.isPending}
            />
            <FieldError message={form.errors.slaDueAtLocal} />
          </div>

          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Created By: </span>
            <span className="font-medium">{currentUser?.name ?? 'Current user'}</span>
          </div>
        </Card>

        <div className="sticky bottom-3 z-10">
          <Card className="flex items-center justify-between gap-3 border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <p className="text-xs text-muted-foreground">Press Enter on the final field or use Create Ticket.</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tickets')}
                disabled={createTicketMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Ticket
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </section>
  )
}
