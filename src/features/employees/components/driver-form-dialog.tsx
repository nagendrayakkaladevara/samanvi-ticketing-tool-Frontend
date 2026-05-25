import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { SteeringWheelIcon } from '@/components/icons/steering-wheel-icon'
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
import { driversService } from '@/features/employees/api/drivers.service'
import {
  DocumentUploadField,
  EmployeeFormLoadingState,
  EmployeeFormSection,
} from '@/features/employees/components/employee-shared'
import { useDriverDetailQuery } from '@/features/employees/hooks/use-drivers-query'
import type { Driver, DriverFormValues } from '@/features/employees/types/driver'
import {
  buildDriverPayload,
  defaultDriverFormValues,
  driverToFormValues,
} from '@/features/employees/utils/driver-model'
import { handleEmployeeFormError } from '@/features/employees/utils/employee-model'
import { queryClient } from '@/lib/query/query-client'

type FormMode = 'create' | 'edit'

type DriverFormDialogProps = {
  open: boolean
  mode: FormMode
  editingItem: Driver | null
  onOpenChange: (open: boolean) => void
}

export function DriverFormDialog({ open, mode, editingItem, onOpenChange }: DriverFormDialogProps) {
  const [formValues, setFormValues] = useState<DriverFormValues>(defaultDriverFormValues)
  const { data: detail, isLoading: isLoadingDetail } = useDriverDetailQuery(
    editingItem?.id ?? null,
    open && mode === 'edit',
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && detail) {
      setFormValues(driverToFormValues(detail))
      return
    }
    if (mode === 'create') {
      setFormValues(defaultDriverFormValues)
    }
  }, [open, mode, detail])

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildDriverPayload>) => driversService.create(payload),
    onSuccess: () => {
      toast.success('Driver created successfully.')
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to create driver.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildDriverPayload>) => {
      if (!editingItem) throw new Error('Unable to identify the selected driver.')
      return driversService.update({ driverId: editingItem.id, ...payload })
    },
    onSuccess: () => {
      toast.success('Driver updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['drivers', editingItem?.id] })
      onOpenChange(false)
    },
    onError: (mutationError) => {
      handleEmployeeFormError(mutationError, 'Failed to update driver.')
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isFormReady = mode === 'create' || (mode === 'edit' && !isLoadingDetail && Boolean(detail))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const payload = buildDriverPayload(formValues, mode)
      if (mode === 'create') {
        createMutation.mutate(payload)
        return
      }
      updateMutation.mutate(payload)
    } catch (error) {
      handleEmployeeFormError(error, 'Please review the driver form and try again.')
    }
  }

  const updateField = <K extends keyof DriverFormValues>(key: K, value: DriverFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SteeringWheelIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            {mode === 'create' ? 'Add Driver' : 'Edit Driver'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Register a new driver with identity, license, transport, and bank details.'
              : 'Update driver information. Leave documents unchanged unless you upload replacements.'}
          </DialogDescription>
        </DialogHeader>

        {!isFormReady ? (
          <EmployeeFormLoadingState />
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <EmployeeFormSection title="Personal Details">
              <div className="space-y-2">
                <FormLabel htmlFor="aadharName" required={mode === 'create'}>Aadhar Name</FormLabel>
                <Input
                  id="aadharName"
                  value={formValues.aadharName}
                  onChange={(event) => updateField('aadharName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="dlName" required={mode === 'create'}>DL Name</FormLabel>
                <Input
                  id="dlName"
                  value={formValues.dlName}
                  onChange={(event) => updateField('dlName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="dateOfBirth" required={mode === 'create'}>Date of Birth</FormLabel>
                <MasterDatePicker
                  id="dateOfBirth"
                  value={formValues.dateOfBirth}
                  onChange={(value) => updateField('dateOfBirth', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="mobileNumber" required={mode === 'create'}>Mobile Number</FormLabel>
                <Input
                  id="mobileNumber"
                  value={formValues.mobileNumber}
                  onChange={(event) => updateField('mobileNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="alternateMobile">Alternate Mobile</FormLabel>
                <Input
                  id="alternateMobile"
                  value={formValues.alternateMobile}
                  onChange={(event) => updateField('alternateMobile', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="emergencyNumber">Emergency Number</FormLabel>
                <Input
                  id="emergencyNumber"
                  value={formValues.emergencyNumber}
                  onChange={(event) => updateField('emergencyNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="aadharNumber" required={mode === 'create'}>Aadhar Number</FormLabel>
                <Input
                  id="aadharNumber"
                  value={formValues.aadharNumber}
                  onChange={(event) => updateField('aadharNumber', event.target.value)}
                  disabled={isSaving}
                  inputMode="numeric"
                  maxLength={12}
                  required
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="License & Transport">
              <div className="space-y-2">
                <FormLabel htmlFor="dlNumber" required={mode === 'create'}>DL Number</FormLabel>
                <Input
                  id="dlNumber"
                  value={formValues.dlNumber}
                  onChange={(event) => updateField('dlNumber', event.target.value)}
                  disabled={isSaving}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="dlIssueDate" required={mode === 'create'}>DL Issue Date</FormLabel>
                <MasterDatePicker
                  id="dlIssueDate"
                  value={formValues.dlIssueDate}
                  onChange={(value) => updateField('dlIssueDate', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="dlExpiryDate" required={mode === 'create'}>DL Expiry Date</FormLabel>
                <MasterDatePicker
                  id="dlExpiryDate"
                  value={formValues.dlExpiryDate}
                  onChange={(value) => updateField('dlExpiryDate', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="transportIssueDate" required={mode === 'create'}>Transport Issue Date</FormLabel>
                <MasterDatePicker
                  id="transportIssueDate"
                  value={formValues.transportIssueDate}
                  onChange={(value) => updateField('transportIssueDate', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="transportValidFrom" required={mode === 'create'}>Transport Valid From</FormLabel>
                <MasterDatePicker
                  id="transportValidFrom"
                  value={formValues.transportValidFrom}
                  onChange={(value) => updateField('transportValidFrom', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="transportValidTo" required={mode === 'create'}>Transport Valid To</FormLabel>
                <MasterDatePicker
                  id="transportValidTo"
                  value={formValues.transportValidTo}
                  onChange={(value) => updateField('transportValidTo', value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Bank Details">
              <div className="space-y-2">
                <FormLabel htmlFor="accountHolderName" required={mode === 'create'}>Account Holder Name</FormLabel>
                <Input
                  id="accountHolderName"
                  value={formValues.accountHolderName}
                  onChange={(event) => updateField('accountHolderName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="accountNumber" required={mode === 'create'}>Account Number</FormLabel>
                <Input
                  id="accountNumber"
                  value={formValues.accountNumber}
                  onChange={(event) => updateField('accountNumber', event.target.value)}
                  disabled={isSaving}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="bankName" required={mode === 'create'}>Bank Name</FormLabel>
                <Input
                  id="bankName"
                  value={formValues.bankName}
                  onChange={(event) => updateField('bankName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="branchName" required={mode === 'create'}>Branch Name</FormLabel>
                <Input
                  id="branchName"
                  value={formValues.branchName}
                  onChange={(event) => updateField('branchName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="ifscCode" required={mode === 'create'}>IFSC Code</FormLabel>
                <Input
                  id="ifscCode"
                  value={formValues.ifscCode}
                  onChange={(event) => updateField('ifscCode', event.target.value.toUpperCase())}
                  disabled={isSaving}
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="upiId">UPI ID</FormLabel>
                <Input
                  id="upiId"
                  value={formValues.upiId}
                  onChange={(event) => updateField('upiId', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                />
              </div>
            </EmployeeFormSection>

            <EmployeeFormSection title="Employment">
              <div className="space-y-2">
                <FormLabel htmlFor="dateOfJoining" required={mode === 'create'}>Date of Joining</FormLabel>
                <MasterDatePicker
                  id="dateOfJoining"
                  value={formValues.dateOfJoining}
                  onChange={(value) => updateField('dateOfJoining', value)}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="dateOfLeaving">Date of Leaving</FormLabel>
                <MasterDatePicker
                  id="dateOfLeaving"
                  value={formValues.dateOfLeaving}
                  onChange={(value) => updateField('dateOfLeaving', value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="referenceName" required={mode === 'create'}>Reference Name</FormLabel>
                <Input
                  id="referenceName"
                  value={formValues.referenceName}
                  onChange={(event) => updateField('referenceName', event.target.value)}
                  disabled={isSaving}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <FormLabel htmlFor="remarks">Remarks</FormLabel>
                <Textarea
                  id="remarks"
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
                id="aadharCardFront"
                label="Aadhar Card Front"
                value={formValues.aadharCardFront}
                onChange={(value) => updateField('aadharCardFront', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="aadharCardBack"
                label="Aadhar Card Back"
                value={formValues.aadharCardBack}
                onChange={(value) => updateField('aadharCardBack', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="dlFront"
                label="DL Front"
                value={formValues.dlFront}
                onChange={(value) => updateField('dlFront', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="dlBack"
                label="DL Back"
                value={formValues.dlBack}
                onChange={(value) => updateField('dlBack', value)}
                disabled={isSaving}
                required={mode === 'create'}
              />
              <DocumentUploadField
                id="upiScanner"
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
                {mode === 'create' ? 'Add Driver' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
