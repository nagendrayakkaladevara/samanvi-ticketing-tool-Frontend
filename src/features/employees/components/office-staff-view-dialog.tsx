import { BriefcaseBusiness, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  EmployeeDetailItem,
  EmployeeDocumentPreview,
} from '@/features/employees/components/employee-shared'
import { useOfficeStaffDetailQuery } from '@/features/employees/hooks/use-office-staff-query'
import type { OfficeStaff } from '@/features/employees/types/office-staff'
import { formatEmployeeDateTime } from '@/features/employees/utils/employee-model'
import { formatMasterDateDisplay } from '@/lib/utils/master-dates'

type OfficeStaffViewDialogProps = {
  open: boolean
  item: OfficeStaff | null
  onOpenChange: (open: boolean) => void
}

export function OfficeStaffViewDialog({ open, item, onOpenChange }: OfficeStaffViewDialogProps) {
  const { data: detail, isLoading } = useOfficeStaffDetailQuery(item?.id ?? null, open && Boolean(item))
  const staff = detail ?? item

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            {staff ? staff.staffIdNumber : 'Office Staff Details'}
          </DialogTitle>
          <DialogDescription>
            {staff
              ? `${staff.aadharName} · ${staff.designation}`
              : 'Complete office staff profile and documents.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !detail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading office staff details...
          </div>
        ) : staff ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <EmployeeDetailItem label="Staff ID" value={staff.staffIdNumber} />
              <EmployeeDetailItem label="Full Name" value={staff.aadharName} />
              <EmployeeDetailItem label="Nick Name" value={staff.nickName} />
              <EmployeeDetailItem label="Designation" value={staff.designation} />
              <EmployeeDetailItem label="Date of Birth" value={formatMasterDateDisplay(staff.dateOfBirth)} />
              <EmployeeDetailItem label="Mobile Number" value={staff.mobileNumber} />
              <EmployeeDetailItem label="Alternative Mobile" value={staff.alternativeMobile} />
              <EmployeeDetailItem label="Emergency Contact" value={staff.emergencyContact} />
              <EmployeeDetailItem label="Aadhar Number" value={staff.aadharNumber} />
              <EmployeeDetailItem label="Date of Joining" value={formatMasterDateDisplay(staff.dateOfJoining)} />
              <EmployeeDetailItem label="Date of Leaving" value={formatMasterDateDisplay(staff.dateOfLeaving)} />
              <EmployeeDetailItem label="Reference Name" value={staff.referenceName} />
              <EmployeeDetailItem label="Remarks" value={staff.remarks} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Bank</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <EmployeeDetailItem label="Account Holder" value={staff.accountHolderName} />
                <EmployeeDetailItem label="Account Number" value={staff.accountNumber} />
                <EmployeeDetailItem label="Bank Name" value={staff.bankName} />
                <EmployeeDetailItem label="Branch Name" value={staff.branchName} />
                <EmployeeDetailItem label="IFSC Code" value={staff.ifscCode} />
                <EmployeeDetailItem label="UPI ID" value={staff.upiId} />
              </div>
            </div>

            {detail ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Documents
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <EmployeeDocumentPreview label="Aadhar Front" base64={detail.aadharCardFront} />
                  <EmployeeDocumentPreview label="Aadhar Back" base64={detail.aadharCardBack} />
                  <EmployeeDocumentPreview label="UPI Scanner" base64={detail.upiScanner} />
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
              <EmployeeDetailItem label="Created" value={formatEmployeeDateTime(staff.createdAt)} />
              <EmployeeDetailItem label="Last Updated" value={formatEmployeeDateTime(staff.updatedAt)} />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
