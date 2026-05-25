import { Download, Loader2 } from 'lucide-react'
import { SteeringWheelIcon } from '@/components/icons/steering-wheel-icon'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  EmployeeDetailItem,
  EmployeeDocumentPreview,
} from '@/features/employees/components/employee-shared'
import { useDriverDetailQuery } from '@/features/employees/hooks/use-drivers-query'
import type { Driver } from '@/features/employees/types/driver'
import { downloadDriverPdf } from '@/features/employees/utils/download-driver-pdf'
import { formatEmployeeDateTime } from '@/features/employees/utils/employee-model'
import { formatMasterDateDisplay } from '@/lib/utils/master-dates'

type DriverViewDialogProps = {
  open: boolean
  item: Driver | null
  onOpenChange: (open: boolean) => void
}

export function DriverViewDialog({ open, item, onOpenChange }: DriverViewDialogProps) {
  const { data: detail, isLoading } = useDriverDetailQuery(item?.id ?? null, open && Boolean(item))

  const driver = detail ?? item

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[min(96vw,42rem)] md:max-w-[min(94vw,56rem)] lg:max-w-[min(92vw,64rem)] xl:max-w-[min(90vw,72rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SteeringWheelIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            {driver ? driver.driverIdNumber : 'Driver Details'}
          </DialogTitle>
          <DialogDescription>
            {driver ? `${driver.aadharName} · ${driver.mobileNumber}` : 'Complete driver profile and documents.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading driver details...
          </div>
        ) : driver ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <EmployeeDetailItem label="Driver ID" value={driver.driverIdNumber} />
              <EmployeeDetailItem label="Aadhar Name" value={driver.aadharName} />
              <EmployeeDetailItem label="DL Name" value={driver.dlName} />
              <EmployeeDetailItem
                label="Date of Birth"
                value={formatMasterDateDisplay(driver.dateOfBirth)}
              />
              <EmployeeDetailItem label="Mobile Number" value={driver.mobileNumber} />
              <EmployeeDetailItem label="Alternate Mobile" value={driver.alternateMobile} />
              <EmployeeDetailItem label="Emergency Number" value={driver.emergencyNumber} />
              <EmployeeDetailItem label="Aadhar Number" value={driver.aadharNumber} />
              <EmployeeDetailItem label="DL Number" value={driver.dlNumber} />
              <EmployeeDetailItem
                label="DL Issue Date"
                value={formatMasterDateDisplay(driver.dlIssueDate)}
              />
              <EmployeeDetailItem
                label="DL Expiry Date"
                value={formatMasterDateDisplay(driver.dlExpiryDate)}
                dateValue={driver.dlExpiryDate}
              />
              <EmployeeDetailItem
                label="Transport Valid To"
                value={formatMasterDateDisplay(driver.transportValidTo)}
                dateValue={driver.transportValidTo}
              />
              <EmployeeDetailItem
                label="Date of Joining"
                value={formatMasterDateDisplay(driver.dateOfJoining)}
              />
              <EmployeeDetailItem
                label="Date of Leaving"
                value={formatMasterDateDisplay(driver.dateOfLeaving)}
              />
              <EmployeeDetailItem label="Reference Name" value={driver.referenceName} />
              <EmployeeDetailItem label="Remarks" value={driver.remarks} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Bank</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <EmployeeDetailItem label="Account Holder" value={driver.accountHolderName} />
                <EmployeeDetailItem label="Account Number" value={driver.accountNumber} />
                <EmployeeDetailItem label="Bank Name" value={driver.bankName} />
                <EmployeeDetailItem label="Branch Name" value={driver.branchName} />
                <EmployeeDetailItem label="IFSC Code" value={driver.ifscCode} />
                <EmployeeDetailItem label="UPI ID" value={driver.upiId} />
              </div>
            </div>

            {detail ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Documents
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <EmployeeDocumentPreview label="Aadhar Front" base64={detail.aadharCardFront} />
                  <EmployeeDocumentPreview label="Aadhar Back" base64={detail.aadharCardBack} />
                  <EmployeeDocumentPreview label="DL Front" base64={detail.dlFront} />
                  <EmployeeDocumentPreview label="DL Back" base64={detail.dlBack} />
                  <EmployeeDocumentPreview label="UPI Scanner" base64={detail.upiScanner} />
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
              <EmployeeDetailItem label="Created" value={formatEmployeeDateTime(driver.createdAt)} />
              <EmployeeDetailItem label="Last Updated" value={formatEmployeeDateTime(driver.updatedAt)} />
            </div>
          </div>
        ) : null}

        {driver ? (
          <DialogFooter className="border-t pt-4 sm:justify-start">
            <Button type="button" variant="outline" onClick={() => downloadDriverPdf(driver)}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
