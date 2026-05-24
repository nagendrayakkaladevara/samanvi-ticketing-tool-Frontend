import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { HardHat, Loader2 } from 'lucide-react'
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
import { helpersService } from '@/features/employees/api/helpers.service'
import {
  DocumentUploadField,
  EmployeeFormLoadingState,
  EmployeeFormSection,
} from '@/features/employees/components/employee-shared'
import { useHelperDetailQuery } from '@/features/employees/hooks/use-helpers-query'
import type { Helper, HelperFormValues } from '@/features/employees/types/helper'
import { handleEmployeeFormError } from '@/features/employees/utils/employee-model'
import {
  buildHelperPayload,
  defaultHelperFormValues,
  helperToFormValues,
} from '@/features/employees/utils/helper-model'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

type HelperFormDialogProps = {
  open: boolean
  mode: FormMode
  editingItem: Helper | null
  onOpenChange: (open: boolean) => void
}

export function HelperFormDialog({ open, mode, editingItem, onOpenChange }: HelperFormDialogProps) {
  const [formValues, setFormValues] = useState<HelperFormValues>(defaultHelperFormValues)
  const { data: detail, isLoading: isLoadingDetail } = useHelperDetailQuery(
    editingItem?.id ?? null,
    open && mode === 'edit',
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && detail) {
      setFormValues(helperToFormValues(detail))
      return
    }
    if (mode === 'create') {
      setFormValues(defaultHelperFormValues)
    }
  }, [open, mode, detail])

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildHelperPayload>) => helpersService.create(payload),
    onSuccess: () => {
      toast.success('Helper created successfully.')
      queryClient.invalidateQueries({ queryKey: ['helpers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to create helper.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildHelperPayload>) => {
      if (!editingItem) throw new Error('Unable to identify the selected helper.')
      return helpersService.update({ helperId: editingItem.id, ...payload })
    },
    onSuccess: () => {
      toast.success('Helper updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['helpers'] })
      queryClient.invalidateQueries({ queryKey: ['helpers', editingItem?.id] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to update helper.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isFormReady = mode === 'create' || (mode === 'edit' && !isLoadingDetail && Boolean(detail))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = buildHelperPayload(formValues, mode)
      if (mode === 'create') {
        createMutation.mutate(payload)
        return
      }
      updateMutation.mutate(payload)
    } catch (error) {
      handleEmployeeFormError(error, 'Please review the helper form and try again.')
    }
  }

  const updateField = <K extends keyof HelperFormValues>(key: K, value: HelperFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {mode === 'create' ? 'Add Helper' : 'Edit Helper'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Register a new helper with identity, employment, and bank details.'
              : 'Update helper information. Leave documents unchanged unless you upload replacements.'}
          </DialogDescription>
        </DialogHeader>

        {!isFormReady ? (
          <EmployeeFormLoadingState />
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <EmployeeFormSection title="Personal Details">
              <div className="space-y-2">
                <Label htmlFor="helperAadharName">Aadhar Name</Label>
                <Input
                  id="helperAadharName"
                  value={formValues.aadharName}
                  onChange={(event) => updateField('aadharName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickName">Nick Name</Label>
                <Input
                  id="nickName"
                  value={formValues.nickName}
                  onChange={(event) => updateField('nickName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperDateOfBirth">Date of Birth</Label>
                <MasterDatePicker
                  id="helperDateOfBirth"
                  value={formValues.dateOfBirth}
                  onChange={(value) => updateField('dateOfBirth', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperMobileNumber">Mobile Number</Label>
                <Input
                  id="helperMobileNumber"
                  value={formValues.mobileNumber}
                  onChange={(event) => updateField('mobileNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternateNumber">Alternate Number</Label>
                <Input
                  id="alternateNumber"
                  value={formValues.alternateNumber}
                  onChange={(event) => updateField('alternateNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyMobile">Emergency Mobile</Label>
                <Input
                  id="emergencyMobile"
                  value={formValues.emergencyMobile}
                  onChange={(event) => updateField('emergencyMobile', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperAadharNumber">Aadhar Number</Label>
                <Input
                  id="helperAadharNumber"
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
                <Label htmlFor="helperAccountHolderName">Account Holder Name</Label>
                <Input
                  id="helperAccountHolderName"
                  value={formValues.accountHolderName}
                  onChange={(event) => updateField('accountHolderName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperAccountNumber">Account Number</Label>
                <Input
                  id="helperAccountNumber"
                  value={formValues.accountNumber}
                  onChange={(event) => updateField('accountNumber', event.target.value)}
                  disabled={isSaving}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperBankName">Bank Name</Label>
                <Input
                  id="helperBankName"
                  value={formValues.bankName}
                  onChange={(event) => updateField('bankName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperBranchName">Branch Name</Label>
                <Input
                  id="helperBranchName"
                  value={formValues.branchName}
                  onChange={(event) => updateField('branchName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperIfscCode">IFSC Code</Label>
                <Input
                  id="helperIfscCode"
                  value={formValues.ifscCode}
                  onChange={(event) => updateField('ifscCode', event.target.value.toUpperCase())}
                  disabled={isSaving}
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperUpiId">UPI ID</Label>
                <Input
                  id="helperUpiId"
                  value={formValues.upiId}
                  onChange={(event) => updateField('upiId', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Employment">
              <div className="space-y-2">
                <Label htmlFor="helperDateOfJoining">Date of Joining</Label>
                <MasterDatePicker
                  id="helperDateOfJoining"
                  value={formValues.dateOfJoining}
                  onChange={(value) => updateField('dateOfJoining', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="helperDateOfLeaving">Date of Leaving</Label>
                <MasterDatePicker
                  id="helperDateOfLeaving"
                  value={formValues.dateOfLeaving}
                  onChange={(value) => updateField('dateOfLeaving', value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formValues.reference}
                  onChange={(event) => updateField('reference', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="helperRemarks">Remarks</Label>
                <Textarea
                  id="helperRemarks"
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
                id="helperAadharCardFront"
                label="Aadhar Card Front"
                value={formValues.aadharCardFront}
                onChange={(value) => updateField('aadharCardFront', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="helperAadharCardBack"
                label="Aadhar Card Back"
                value={formValues.aadharCardBack}
                onChange={(value) => updateField('aadharCardBack', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="helperUpiScanner"
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
                {mode === 'create' ? 'Add Helper' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
