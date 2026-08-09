import type { FormEventHandler } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { FormLabel } from '@/components/ui/form-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { notificationQueryKeys } from '@/features/notifications/hooks/notification-query-keys'
import { BusNumberAutocomplete } from '@/features/tickets/components/bus-number-autocomplete'
import { ticketsService } from '@/features/tickets/api/tickets.service'
import { useCreateTicketForm } from '@/features/tickets/hooks/use-create-ticket-form'
import { getTicketDetailsPath } from '@/features/tickets/utils/ticket-routes'
import { useCurrentUser } from '@/hooks/use-current-user'
import { queryClient } from '@/lib/query/query-client'
import { invalidFieldClass } from '@/lib/form/form-field-styles'
import { cn } from '@/lib/utils'

const MIN_DESCRIPTION_WORDS_FOR_AI = 4

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
      // Create first; assignment is a separate request. If assign fails after create
      // succeeds, treat that as partial success so the user is not prompted to
      // resubmit and create a duplicate ticket.
      const createdTicket = await ticketsService.create(form.payload)
      if (!variables.assignedToId) {
        return { createdTicket, assigned: false as const, assignmentFailed: false as const }
      }

      try {
        await ticketsService.assign({
          ticketId: createdTicket.id,
          assignedToId: variables.assignedToId,
        })
        return { createdTicket, assigned: true as const, assignmentFailed: false as const }
      } catch {
        return { createdTicket, assigned: false as const, assignmentFailed: true as const }
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
      form.resetForm()

      if (result.assignmentFailed) {
        toast.warning('Ticket created, but assignment failed. You can assign it from the ticket details page.')
        navigate(getTicketDetailsPath(result.createdTicket.id))
        return
      }

      toast.success(result.assigned ? 'Ticket created and assigned successfully.' : 'Ticket created successfully.')
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
    if (Object.keys(nextErrors).length > 0) {
      form.setErrors(nextErrors)
      toast.error('Please fill all required fields.')
      return
    }
    createTicketMutation.mutate({ assignedToId: form.values.assignedToId })
  }

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
            <FormLabel htmlFor="title" required>
              Title
            </FormLabel>
            <Input
              id="title"
              placeholder="e.g., Engine overheating on route 42"
              className={cn(form.errors.title && invalidFieldClass)}
              value={form.values.title}
              onChange={(event) => form.setField('title', event.target.value)}
              onBlur={() => form.blurField('title')}
              aria-invalid={Boolean(form.errors.title)}
              disabled={createTicketMutation.isPending}
            />
            <FieldError message={form.errors.title} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FormLabel htmlFor="description" required>
                Description
              </FormLabel>
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
                  form.errors.description && invalidFieldClass,
                )}
                value={form.values.description}
                onChange={(event) => form.setField('description', event.target.value)}
                onBlur={() => form.blurField('description')}
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
              <FormLabel htmlFor="severity" required>
                Severity
              </FormLabel>
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
              <FormLabel htmlFor="priority" required>
                Priority
              </FormLabel>
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
              <FormLabel htmlFor="categoryId" required>
                Category
              </FormLabel>
              <Select
                value={form.values.categoryId}
                onValueChange={(value) => form.setField('categoryId', value)}
                disabled={createTicketMutation.isPending || isCategoriesLoading}
              >
                <SelectTrigger
                  id="categoryId"
                  aria-invalid={Boolean(form.errors.categoryId)}
                  className={cn(form.errors.categoryId && invalidFieldClass)}
                  onBlur={() => form.blurField('categoryId')}
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
              <FormLabel htmlFor="busNumber" required>
                Bus Number
              </FormLabel>
              <BusNumberAutocomplete
                id="busNumber"
                placeholder="e.g., AP09AB1234"
                className={cn(form.errors.busNumber && invalidFieldClass)}
                value={form.values.busNumber}
                onChange={(nextValue) => form.setField('busNumber', nextValue)}
                onBlur={() => form.blurField('busNumber')}
                aria-invalid={Boolean(form.errors.busNumber)}
                disabled={createTicketMutation.isPending}
              />
              <FieldError message={form.errors.busNumber} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <FormLabel htmlFor="assignedToId">Assign To</FormLabel>
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
              <FormLabel htmlFor="slaDueAtLocal" required>
                SLA Due At
              </FormLabel>
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
              className={cn(
                'dark:[color-scheme:dark]',
                form.errors.slaDueAtLocal && invalidFieldClass,
              )}
              value={form.values.slaDueAtLocal}
              onChange={(event) => form.setField('slaDueAtLocal', event.target.value)}
              onBlur={() => form.blurField('slaDueAtLocal')}
              aria-invalid={Boolean(form.errors.slaDueAtLocal)}
              disabled={createTicketMutation.isPending}
            />
            <FieldError message={form.errors.slaDueAtLocal} />
          </div>

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Created By: </span>
            <span className="font-medium text-foreground">{currentUser?.name ?? 'Current user'}</span>
          </div>
        </Card>

        <div className="sticky bottom-3 z-10">
          <Card className="flex items-center justify-between gap-3 border border-border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:shadow-black/30">
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
