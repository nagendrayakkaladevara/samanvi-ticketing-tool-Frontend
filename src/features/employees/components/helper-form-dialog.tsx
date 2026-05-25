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
import { FormLabel } from '@/components/ui/form-label'
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
                <FormLabel htmlFor="helperAadharName" required={mode === 'create'}>Aadhar Name</FormLabel>
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
                <FormLabel htmlFor="nickName" required={mode === 'create'}>Nick Name</FormLabel>
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
                <FormLabel htmlFor="helperDateOfBirth" required={mode === 'create'}>Date of Birth</FormLabel>
                <MasterDatePicker
                  id="helperDateOfBirth"
                  value={formValues.dateOfBirth}
                  onChange={(value) => updateField('dateOfBirth', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="helperMobileNumber" required={mode === 'create'}>Mobile Number</FormLabel>
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
                <FormLabel htmlFor="alternateNumber">Alternate Number</FormLabel>
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
                <FormLabel htmlFor="emergencyMobile">Emergency Mobile</FormLabel>
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
                <FormLabel htmlFor="helperAadharNumber" required={mode === 'create'}>Aadhar Number</FormLabel>
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
                <FormLabel htmlFor="helperAccountHolderName" required={mode === 'create'}>Account Holder Name</FormLabel>
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
                <FormLabel htmlFor="helperAccountNumber" required={mode === 'create'}>Account Number</FormLabel>
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
                <FormLabel htmlFor="helperBankName" required={mode === 'create'}>Bank Name</FormLabel>
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
                <FormLabel htmlFor="helperBranchName" required={mode === 'create'}>Branch Name</FormLabel>
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
                <FormLabel htmlFor="helperIfscCode" required={mode === 'create'}>IFSC Code</FormLabel>
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
                <FormLabel htmlFor="helperUpiId">UPI ID</FormLabel>
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
                <FormLabel htmlFor="helperDateOfJoining" required={mode === 'create'}>Date of Joining</FormLabel>
                <MasterDatePicker
                  id="helperDateOfJoining"
                  value={formValues.dateOfJoining}
                  onChange={(value) => updateField('dateOfJoining', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="helperDateOfLeaving">Date of Leaving</FormLabel>
                <MasterDatePicker
                  id="helperDateOfLeaving"
                  value={formValues.dateOfLeaving}
                  onChange={(value) => updateField('dateOfLeaving', value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="reference" required={mode === 'create'}>Reference</FormLabel>
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
                <FormLabel htmlFor="helperRemarks">Remarks</FormLabel>
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
