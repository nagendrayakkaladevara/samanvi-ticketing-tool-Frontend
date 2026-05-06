import { ArrowLeft, ArrowRight, BusFront, CalendarDays, ClipboardList, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBusTicketHistoryQuery } from '@/features/buses/hooks/use-bus-ticket-history-query'

function formatDateTime(rawDate?: string): string {
  if (!rawDate) return 'Unknown'
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function BusTicketHistoryPage() {
  const navigate = useNavigate()
  const { busId = '' } = useParams()
  const location = useLocation()
  const busNumberFromState = (location.state as { busNumber?: string } | null)?.busNumber
  const { data: tickets = [], isLoading, isError, error } = useBusTicketHistoryQuery(busId)

  const heading = useMemo(() => busNumberFromState ?? `Bus ${busId.slice(0, 8)}`, [busId, busNumberFromState])

  return (
    <section className="space-y-5">
      <header className="space-y-3">
        <Button variant="ghost" className="-ml-3 w-fit" onClick={() => navigate('/buses')}>
          <ArrowLeft className="h-4 w-4" />
          Back to buses
        </Button>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-muted/40">
            <BusFront className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{heading} Ticket History</h1>
            <p className="text-sm text-muted-foreground">Timeline of issues recorded against this bus.</p>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </Card>
      ) : null}

      {isError ? (
        <Card className="space-y-2 p-5">
          <p className="font-semibold text-destructive">Unable to load bus ticket history</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unexpected error occurred.'}</p>
        </Card>
      ) : null}

      {!isLoading && !isError && tickets.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No tickets for this bus yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Once issues are created against this bus, they will appear here.
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && tickets.length > 0 ? (
        <>
          <div className="grid gap-3 md:hidden">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">{ticket.title}</h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <span>Status</span>
                  <span className="text-foreground">{ticket.status.replaceAll('_', ' ')}</span>
                  <span>Severity</span>
                  <span className="text-foreground">{ticket.severity}</span>
                  <span>Priority</span>
                  <span className="text-foreground">{ticket.priority}</span>
                  <span>Assigned</span>
                  <span className="text-foreground">{ticket.assignedToName ?? 'Unassigned'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(ticket.createdAt)}
                </div>
                <Button size="sm" className="w-full" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  View Ticket
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{ticket.title}</td>
                    <td className="px-4 py-3">{ticket.status.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3">{ticket.severity}</td>
                    <td className="px-4 py-3">{ticket.priority}</td>
                    <td className="px-4 py-3">{ticket.assignedToName ?? 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateTime(ticket.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        View
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading ticket history...
        </div>
      ) : null}
    </section>
  )
}
