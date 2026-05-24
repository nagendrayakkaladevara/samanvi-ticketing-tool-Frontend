import { Download, Route } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ServiceNumber } from '@/features/service-numbers/types/service-number'
import { downloadServiceNumberPdf } from '@/features/service-numbers/utils/download-service-number-pdf'
import {
  formatAmount,
  formatDateTime,
  formatDistance,
} from '@/features/service-numbers/utils/service-number-model'

type ServiceNumberViewDialogProps = {
  open: boolean
  item: ServiceNumber | null
  onOpenChange: (open: boolean) => void
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export function ServiceNumberViewDialog({ open, item, onOpenChange }: ServiceNumberViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {item ? item.serviceNo : 'Service Number'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? `${item.from} → ${item.to} via ${item.via} · ${item.serviceFor.serviceFor}`
              : 'Full route and fare details for this service number.'}
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Service For" value={item.serviceFor.serviceFor} />
              <DetailItem label="Service Number" value={item.serviceNo} />
              <DetailItem label="From" value={item.from} />
              <DetailItem label="To" value={item.to} />
              <DetailItem label="Via" value={item.via} />
              <DetailItem label="Distance" value={formatDistance(item.distance)} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Amounts</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Parking Amount" value={formatAmount(item.parkingAmount)} />
                <DetailItem label="Driver One Beta" value={formatAmount(item.driverOneBeta)} />
                <DetailItem label="Driver Two Beta" value={formatAmount(item.driverTwoBeta)} />
                <DetailItem label="Helper Beta" value={formatAmount(item.helperBeta)} />
                <DetailItem label="Conductor Beta" value={formatAmount(item.conductorBeta)} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Crew</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Optional Driver" value={item.optDriver} />
                <DetailItem label="Optional Helper" value={item.optHelper} />
              </div>
            </div>

            <DetailItem label="Remarks" value={item.remarks} />

            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
              <DetailItem label="Created" value={formatDateTime(item.createdAt)} />
              <DetailItem label="Last Updated" value={formatDateTime(item.updatedAt)} />
            </div>
          </div>
        ) : null}

        {item ? (
          <DialogFooter className="border-t pt-4 sm:justify-start">
            <Button type="button" variant="outline" onClick={() => downloadServiceNumberPdf(item)}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
