import { HardHat, Loader2 } from 'lucide-react'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MasterDetailGrid } from '@/components/master-detail-grid'
import {
  EmployeeDetailItem,
  EmployeeDocumentPreview,
  EmployeeRecordDialogHeader,
} from '@/features/employees/components/employee-shared'
import { useHelperDetailQuery } from '@/features/employees/hooks/use-helpers-query'
import type { Helper } from '@/features/employees/types/helper'
import { formatEmployeeDateTime } from '@/features/employees/utils/employee-model'
import { formatMasterDateDisplay } from '@/lib/utils/master-dates'

type HelperViewDialogProps = {
  open: boolean
  item: Helper | null
  onOpenChange: (open: boolean) => void
}

export function HelperViewDialog({ open, item, onOpenChange }: HelperViewDialogProps) {
  const { data: detail, isLoading } = useHelperDetailQuery(item?.id ?? null, open && Boolean(item))
  const helper = detail ?? item

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <EmployeeRecordDialogHeader
          icon={<HardHat className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          idNumber={helper?.helperIdNumber}
          aadharName={helper?.aadharName}
          emptyTitle="Helper Details"
          emptyDescription="Complete helper profile and documents."
        />

        {isLoading && !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading helper details...
          </div>
        ) : helper ? (
          <div className="space-y-5">
            <MasterDetailGrid>
              <EmployeeDetailItem label="Helper ID" value={helper.helperIdNumber} />
              <EmployeeDetailItem label="Aadhar Name" value={helper.aadharName} />
              <EmployeeDetailItem label="Nick Name" value={helper.nickName} />
              <EmployeeDetailItem label="Date of Birth" value={formatMasterDateDisplay(helper.dateOfBirth)} />
              <EmployeeDetailItem label="Mobile Number" value={helper.mobileNumber} />
              <EmployeeDetailItem label="Alternate Number" value={helper.alternateNumber} />
              <EmployeeDetailItem label="Emergency Mobile" value={helper.emergencyMobile} />
              <EmployeeDetailItem label="Aadhar Number" value={helper.aadharNumber} />
              <EmployeeDetailItem label="Date of Joining" value={formatMasterDateDisplay(helper.dateOfJoining)} />
              <EmployeeDetailItem label="Date of Leaving" value={formatMasterDateDisplay(helper.dateOfLeaving)} />
              <EmployeeDetailItem label="Reference" value={helper.reference} />
              <EmployeeDetailItem label="Remarks" value={helper.remarks} className="col-span-2" />
            </MasterDetailGrid>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Bank</p>
              <MasterDetailGrid>
                <EmployeeDetailItem label="Account Holder" value={helper.accountHolderName} />
                <EmployeeDetailItem label="Account Number" value={helper.accountNumber} />
                <EmployeeDetailItem label="Bank Name" value={helper.bankName} />
                <EmployeeDetailItem label="Branch Name" value={helper.branchName} />
                <EmployeeDetailItem label="IFSC Code" value={helper.ifscCode} />
                <EmployeeDetailItem label="UPI ID" value={helper.upiId} />
              </MasterDetailGrid>
            </div>

            {detail ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Documents
                </p>
                <MasterDetailGrid className="gap-3 sm:gap-4">
                  <EmployeeDocumentPreview label="Aadhar Front" base64={detail.aadharCardFront} />
                  <EmployeeDocumentPreview label="Aadhar Back" base64={detail.aadharCardBack} />
                  <EmployeeDocumentPreview label="UPI Scanner" base64={detail.upiScanner} />
                </MasterDetailGrid>
              </div>
            ) : null}

            <MasterDetailGrid className="border-t pt-4">
              <EmployeeDetailItem label="Created" value={formatEmployeeDateTime(helper.createdAt)} />
              <EmployeeDetailItem label="Last Updated" value={formatEmployeeDateTime(helper.updatedAt)} />
            </MasterDetailGrid>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
