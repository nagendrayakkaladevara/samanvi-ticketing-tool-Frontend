import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BriefcaseBusiness, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MasterDatePicker } from '@/components/ui/master-date-picker'
import { Textarea } from '@/components/ui/textarea'
import { officeStaffService } from '@/features/employees/api/office-staff.service'
import {
  DocumentUploadField,
  EmployeeFormLoadingState,
  EmployeeFormSection,
} from '@/features/employees/components/employee-shared'
import { useOfficeStaffDetailQuery } from '@/features/employees/hooks/use-office-staff-query'
import type { OfficeStaff, OfficeStaffFormValues } from '@/features/employees/types/office-staff'
import { handleEmployeeFormError } from '@/features/employees/utils/employee-model'
import {
  buildOfficeStaffPayload,
  defaultOfficeStaffFormValues,
  officeStaffToFormValues,
} from '@/features/employees/utils/office-staff-model'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

type OfficeStaffFormDialogProps = {
  open: boolean
  mode: FormMode
  editingItem: OfficeStaff | null
  onOpenChange: (open: boolean) => void
}

export function OfficeStaffFormDialog({ open, mode, editingItem, onOpenChange }: OfficeStaffFormDialogProps) {
  const [formValues, setFormValues] = useState<OfficeStaffFormValues>(defaultOfficeStaffFormValues)
  const { data: detail, isLoading: isLoadingDetail } = useOfficeStaffDetailQuery(
    editingItem?.id ?? null,
    open && mode === 'edit',
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && detail) {
      setFormValues(officeStaffToFormValues(detail))
      return
    }
    if (mode === 'create') {
      setFormValues(defaultOfficeStaffFormValues)
    }
  }, [open, mode, detail])

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildOfficeStaffPayload>) => officeStaffService.create(payload),
    onSuccess: () => {
      toast.success('Office staff member created successfully.')
      queryClient.invalidateQueries({ queryKey: ['office-staff'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to create office staff member.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildOfficeStaffPayload>) => {
      if (!editingItem) throw new Error('Unable to identify the selected office staff member.')
      return officeStaffService.update({ staffId: editingItem.id, ...payload })
    },
    onSuccess: () => {
      toast.success('Office staff member updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['office-staff'] })
      queryClient.invalidateQueries({ queryKey: ['office-staff', editingItem?.id] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to update office staff member.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isFormReady = mode === 'create' || (mode === 'edit' && !isLoadingDetail && Boolean(detail))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = buildOfficeStaffPayload(formValues, mode)
      if (mode === 'create') {
        createMutation.mutate(payload)
        return
      }
      updateMutation.mutate(payload)
    } catch (error) {
      handleEmployeeFormError(error, 'Please review the office staff form and try again.')
    }
  }

  const updateField = <K extends keyof OfficeStaffFormValues>(key: K, value: OfficeStaffFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            {mode === 'create' ? 'Add Office Staff' : 'Edit Office Staff'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Register office staff with designation, identity, and bank details.'
              : 'Update office staff information. Leave documents unchanged unless you upload replacements.'}
          </DialogDescription>
        </DialogHeader>

        {!isFormReady ? (
          <EmployeeFormLoadingState />
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <EmployeeFormSection title="Personal Details">
              <div className="space-y-2">
                <Label htmlFor="staffFullName">Full Name</Label>
                <Input
                  id="staffFullName"
                  value={formValues.aadharName}
                  onChange={(event) => updateField('aadharName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffNickName">Nick Name</Label>
                <Input
                  id="staffNickName"
                  value={formValues.nickName}
                  onChange={(event) => updateField('nickName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formValues.designation}
                  onChange={(event) => updateField('designation', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffDateOfBirth">Date of Birth</Label>
                <MasterDatePicker
                  id="staffDateOfBirth"
                  value={formValues.dateOfBirth}
                  onChange={(value) => updateField('dateOfBirth', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffMobileNumber">Mobile Number</Label>
                <Input
                  id="staffMobileNumber"
                  value={formValues.mobileNumber}
                  onChange={(event) => updateField('mobileNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternativeMobile">Alternative Mobile</Label>
                <Input
                  id="alternativeMobile"
                  value={formValues.alternativeMobile}
                  onChange={(event) => updateField('alternativeMobile', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={formValues.emergencyContact}
                  onChange={(event) => updateField('emergencyContact', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffAadharNumber">Aadhar Number</Label>
                <Input
                  id="staffAadharNumber"
                  value={formValues.aadharNumber}
                  onChange={(event) => updateField('aadharNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={12}
                  required
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Bank Details">
              <div className="space-y-2">
                <Label htmlFor="staffAccountHolderName">Account Holder Name</Label>
                <Input
                  id="staffAccountHolderName"
                  value={formValues.accountHolderName}
                  onChange={(event) => updateField('accountHolderName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffAccountNumber">Account Number</Label>
                <Input
                  id="staffAccountNumber"
                  value={formValues.accountNumber}
                  onChange={(event) => updateField('accountNumber', event.target.value)}
                  disabled={isSaving}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffBankName">Bank Name</Label>
                <Input
                  id="staffBankName"
                  value={formValues.bankName}
                  onChange={(event) => updateField('bankName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffBranchName">Branch Name</Label>
                <Input
                  id="staffBranchName"
                  value={formValues.branchName}
                  onChange={(event) => updateField('branchName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffIfscCode">IFSC Code</Label>
                <Input
                  id="staffIfscCode"
                  value={formValues.ifscCode}
                  onChange={(event) => updateField('ifscCode', event.target.value.toUpperCase())}
                  disabled={isSaving}
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffUpiId">UPI ID</Label>
                <Input
                  id="staffUpiId"
                  value={formValues.upiId}
                  onChange={(event) => updateField('upiId', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Employment">
              <div className="space-y-2">
                <Label htmlFor="staffDateOfJoining">Date of Joining</Label>
                <MasterDatePicker
                  id="staffDateOfJoining"
                  value={formValues.dateOfJoining}
                  onChange={(value) => updateField('dateOfJoining', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffDateOfLeaving">Date of Leaving</Label>
                <MasterDatePicker
                  id="staffDateOfLeaving"
                  value={formValues.dateOfLeaving}
                  onChange={(value) => updateField('dateOfLeaving', value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffReferenceName">Reference Name</Label>
                <Input
                  id="staffReferenceName"
                  value={formValues.referenceName}
                  onChange={(event) => updateField('referenceName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="staffRemarks">Remarks</Label>
                <Textarea
                  id="staffRemarks"
                  value={formValues.remarks}
                  onChange={(event) => updateField('remarks', event.target.value)}
                  disabled={isSaving}
                  maxLength={500}
                  rows={2}
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Documents">
              <DocumentUploadField
                id="staffAadharCardFront"
                label="Aadhar Card Front"
                value={formValues.aadharCardFront}
                onChange={(value) => updateField('aadharCardFront', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="staffAadharCardBack"
                label="Aadhar Card Back"
                value={formValues.aadharCardBack}
                onChange={(value) => updateField('aadharCardBack', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="staffUpiScanner"
                label="UPI Scanner"
                value={formValues.upiScanner}
                onChange={(value) => updateField('upiScanner', value)}
                disabled={isSaving}
                hint="Optional payment QR image."
              />
            </EmployeeFormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === 'create' ? 'Add Office Staff' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
