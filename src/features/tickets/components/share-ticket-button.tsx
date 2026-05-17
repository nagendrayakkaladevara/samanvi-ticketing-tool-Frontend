import { Share2 } from 'lucide-react'
import type { MouseEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  getTicketShareDisplayId,
  shareTicketViaWhatsApp,
  type TicketShareInput,
} from '@/features/tickets/utils/ticket-share'
import { cn } from '@/lib/utils'

type ShareTicketButtonProps = TicketShareInput & {
  className?: string
  showLabel?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function ShareTicketButton({
  ticketId,
  ticketNumber,
  title,
  className,
  showLabel = true,
  size = 'sm',
  variant = 'outline',
}: ShareTicketButtonProps) {
  function handleShare(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    shareTicketViaWhatsApp({ ticketId, ticketNumber, title })
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
      onClick={handleShare}
      aria-label={`Share ticket ${getTicketShareDisplayId(ticketId, ticketNumber)} via WhatsApp`}
    >
      <Share2 className="h-4 w-4 shrink-0" aria-hidden />
      {showLabel ? <span>Share</span> : null}
    </Button>
  )
}
