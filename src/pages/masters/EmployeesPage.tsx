import { useEffect, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BriefcaseBusiness, HardHat, IdCard, Loader2, Plus, RefreshCw, Users } from 'lucide-react'
import { SteeringWheelIcon } from '@/components/icons/steering-wheel-icon'
import { toast } from '@/lib/toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { driversService } from '@/features/employees/api/drivers.service'
import { helpersService } from '@/features/employees/api/helpers.service'
import { officeStaffService } from '@/features/employees/api/office-staff.service'
import { DriverFormDialog } from '@/features/employees/components/driver-form-dialog'
import { DriverViewDialog } from '@/features/employees/components/driver-view-dialog'
import {
  driverDataColumnDefs,
  driverMobileBadge,
  driverMobileFields,
  driverMobileMeta,
  helperDataColumnDefs,
  helperMobileBadge,
  helperMobileFields,
  helperMobileMeta,
  officeStaffDataColumnDefs,
  officeStaffMobileBadge,
  officeStaffMobileFields,
  officeStaffMobileMeta,
} from '@/features/employees/components/employees-grid-columns'
import { EmployeesGrid } from '@/features/employees/components/employees-grid'
import { HelperFormDialog } from '@/features/employees/components/helper-form-dialog'
import { HelperViewDialog } from '@/features/employees/components/helper-view-dialog'
import { OfficeStaffFormDialog } from '@/features/employees/components/office-staff-form-dialog'
import { OfficeStaffViewDialog } from '@/features/employees/components/office-staff-view-dialog'
import { useDriversQuery } from '@/features/employees/hooks/use-drivers-query'
import { useHelpersQuery } from '@/features/employees/hooks/use-helpers-query'
import { useOfficeStaffQuery } from '@/features/employees/hooks/use-office-staff-query'
import type { Driver } from '@/features/employees/types/driver'
import type { Helper } from '@/features/employees/types/helper'
import type { OfficeStaff } from '@/features/employees/types/office-staff'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePermissions, useSubmoduleActions } from '@/hooks/use-permissions'
import { useMasterDialogParams } from '@/hooks/use-master-dialog-params'
import { queryClient } from '@/lib/query/query-client'
import { cn } from '@/lib/utils'

type EmployeeTab = 'driver' | 'helper' | 'office-staff'

const easeOutExpo = [0.22, 1, 0.36, 1] as const

const mobileHeaderVariants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
}

const mobileToolbarVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo, delay: 0.06 },
  },
}

const tabPanelVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
}

function parseEmployeeTab(value: string | null): EmployeeTab {
  if (value === 'helper' || value === 'office-staff') {
    return value
  }
  return 'driver'
}

const tabConfig = {
  driver: {
    label: 'Driver',
    icon: SteeringWheelIcon,
    addLabel: 'Add Driver',
    emptyTitle: 'No drivers yet',
    emptyDescription: 'Add your first driver to manage crew identity, license, and transport records.',
    sectionTitle: 'Driver details',
    sectionIcon: SteeringWheelIcon,
  },
  helper: {
    label: 'Helper',
    icon: HardHat,
    addLabel: 'Add Helper',
    emptyTitle: 'No helpers yet',
    emptyDescription: 'Add helpers to track crew support staff across your fleet operations.',
    sectionTitle: 'Helper details',
    sectionIcon: HardHat,
  },
  'office-staff': {
    label: 'Office Staff',
    icon: BriefcaseBusiness,
    addLabel: 'Add Office Staff',
    emptyTitle: 'No office staff yet',
    emptyDescription: 'Register office staff members with designation and contact details.',
    sectionTitle: 'Staff details',
    sectionIcon: IdCard,
  },
} as const

export function EmployeesPage() {
  const { has } = usePermissions()
  const canViewDriver = has('masters', 'driver', 'view')
  const canViewHelper = has('masters', 'helper', 'view')
  const canViewOfficeStaff = has('masters', 'office_staff', 'view')
  const driverActions = useSubmoduleActions('masters', 'driver')
  const helperActions = useSubmoduleActions('masters', 'helper')
  const officeStaffActions = useSubmoduleActions('masters', 'office_staff')
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()
  const animateMobile = isMobile && !shouldReduceMotion

  const { action, id, tab: tabParam, openDialog, closeDialog, setTabParam } = useMasterDialogParams()
  const activeTab = parseEmployeeTab(tabParam)

  const tabVisibility = useMemo(
    () =>
      ({
        driver: canViewDriver,
        helper: canViewHelper,
        'office-staff': canViewOfficeStaff,
      }) as const,
    [canViewDriver, canViewHelper, canViewOfficeStaff],
  )

  const tabActions = {
    driver: driverActions,
    helper: helperActions,
    'office-staff': officeStaffActions,
  }[activeTab]

  useEffect(() => {
    if (tabVisibility[activeTab]) {
      return
    }

    const firstVisibleTab = (Object.keys(tabConfig) as EmployeeTab[]).find((tab) => tabVisibility[tab])
    if (firstVisibleTab) {
      setTabParam(firstVisibleTab)
    }
  }, [activeTab, canViewDriver, canViewHelper, canViewOfficeStaff, setTabParam, tabVisibility])

  const {
    data: drivers = [],
    isLoading: isLoadingDrivers,
    isFetching: isFetchingDrivers,
    isError: isDriversError,
    error: driversError,
  } = useDriversQuery()

  const {
    data: helpers = [],
    isLoading: isLoadingHelpers,
    isFetching: isFetchingHelpers,
    isError: isHelpersError,
    error: helpersError,
  } = useHelpersQuery()

  const {
    data: officeStaff = [],
    isLoading: isLoadingOfficeStaff,
    isFetching: isFetchingOfficeStaff,
    isError: isOfficeStaffError,
    error: officeStaffError,
  } = useOfficeStaffQuery()

  const sortedDrivers = useMemo(
    () => [...drivers].sort((a, b) => a.driverIdNumber.localeCompare(b.driverIdNumber)),
    [drivers],
  )
  const sortedHelpers = useMemo(
    () => [...helpers].sort((a, b) => a.helperIdNumber.localeCompare(b.helperIdNumber)),
    [helpers],
  )
  const sortedOfficeStaff = useMemo(
    () => [...officeStaff].sort((a, b) => a.staffIdNumber.localeCompare(b.staffIdNumber)),
    [officeStaff],
  )

  const editingDriver = useMemo(
    () => (action === 'edit' && id ? drivers.find((item) => item.id === id) ?? null : null),
    [action, id, drivers],
  )
  const editingHelper = useMemo(
    () => (action === 'edit' && id ? helpers.find((item) => item.id === id) ?? null : null),
    [action, id, helpers],
  )
  const editingOfficeStaff = useMemo(
    () => (action === 'edit' && id ? officeStaff.find((item) => item.id === id) ?? null : null),
    [action, id, officeStaff],
  )

  const viewingDriver = useMemo(
    () => (action === 'view' && id ? drivers.find((item) => item.id === id) ?? null : null),
    [action, id, drivers],
  )
  const viewingHelper = useMemo(
    () => (action === 'view' && id ? helpers.find((item) => item.id === id) ?? null : null),
    [action, id, helpers],
  )
  const viewingOfficeStaff = useMemo(
    () => (action === 'view' && id ? officeStaff.find((item) => item.id === id) ?? null : null),
    [action, id, officeStaff],
  )

  const deleteDriver = useMemo(
    () => (action === 'delete' && id ? drivers.find((item) => item.id === id) ?? null : null),
    [action, id, drivers],
  )
  const deleteHelper = useMemo(
    () => (action === 'delete' && id ? helpers.find((item) => item.id === id) ?? null : null),
    [action, id, helpers],
  )
  const deleteOfficeStaff = useMemo(
    () => (action === 'delete' && id ? officeStaff.find((item) => item.id === id) ?? null : null),
    [action, id, officeStaff],
  )

  const deleteDriverMutation = useMutation({
    mutationFn: (driverId: string) => driversService.remove(driverId),
    onSuccess: () => {
      toast.success('Driver deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      closeDialog()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete driver.')
    },
  })

  const deleteHelperMutation = useMutation({
    mutationFn: (helperId: string) => helpersService.remove(helperId),
    onSuccess: () => {
      toast.success('Helper deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['helpers'] })
      closeDialog()
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Failed to delete helper.')
    },
  })

  const deleteOfficeStaffMutation = useMutation({
    mutationFn: (staffId: string) => officeStaffService.remove(staffId),
    onSuccess: () => {
      toast.success('Office staff member deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['office-staff'] })
      closeDialog()
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Failed to delete office staff member.',
      )
    },
  })

  const isFetching =
    activeTab === 'driver'
      ? isFetchingDrivers
      : activeTab === 'helper'
        ? isFetchingHelpers
        : isFetchingOfficeStaff

  const isLoading =
    activeTab === 'driver'
      ? isLoadingDrivers
      : activeTab === 'helper'
        ? isLoadingHelpers
        : isLoadingOfficeStaff

  const openAddDialog = () => openDialog({ action: 'create', tab: activeTab })
  const openDriverEdit = (item: Driver) => openDialog({ action: 'edit', id: item.id, tab: 'driver' })
  const openHelperEdit = (item: Helper) => openDialog({ action: 'edit', id: item.id, tab: 'helper' })
  const openOfficeStaffEdit = (item: OfficeStaff) =>
    openDialog({ action: 'edit', id: item.id, tab: 'office-staff' })
  const openDriverView = (item: Driver) => openDialog({ action: 'view', id: item.id, tab: 'driver' })
  const openHelperView = (item: Helper) => openDialog({ action: 'view', id: item.id, tab: 'helper' })
  const openOfficeStaffView = (item: OfficeStaff) =>
    openDialog({ action: 'view', id: item.id, tab: 'office-staff' })
  const openDriverDelete = (item: Driver) => openDialog({ action: 'delete', id: item.id, tab: 'driver' })
  const openHelperDelete = (item: Helper) => openDialog({ action: 'delete', id: item.id, tab: 'helper' })
  const openOfficeStaffDelete = (item: OfficeStaff) =>
    openDialog({ action: 'delete', id: item.id, tab: 'office-staff' })

  const isDriverFormOpen =
    activeTab === 'driver' && (action === 'create' || (action === 'edit' && Boolean(editingDriver)))
  const isHelperFormOpen =
    activeTab === 'helper' && (action === 'create' || (action === 'edit' && Boolean(editingHelper)))
  const isOfficeStaffFormOpen =
    activeTab === 'office-staff' &&
    (action === 'create' || (action === 'edit' && Boolean(editingOfficeStaff)))


  const confirmDelete = () => {
    if (deleteDriver) {
      deleteDriverMutation.mutate(deleteDriver.id)
      return
    }
    if (deleteHelper) {
      deleteHelperMutation.mutate(deleteHelper.id)
      return
    }
    if (deleteOfficeStaff) {
      deleteOfficeStaffMutation.mutate(deleteOfficeStaff.id)
    }
  }

  const isDeleting =
    deleteDriverMutation.isPending || deleteHelperMutation.isPending || deleteOfficeStaffMutation.isPending

  const deleteDescription = (() => {
    if (deleteDriver) {
      return `This will permanently remove driver "${deleteDriver.driverIdNumber}" (${deleteDriver.aadharName}). Deletion is blocked if records still reference this driver.`
    }
    if (deleteHelper) {
      return `This will permanently remove helper "${deleteHelper.helperIdNumber}" (${deleteHelper.aadharName}). Deletion is blocked if records still reference this helper.`
    }
    if (deleteOfficeStaff) {
      return `This will permanently remove staff "${deleteOfficeStaff.staffIdNumber}" (${deleteOfficeStaff.aadharName}). Deletion is blocked if records still reference this member.`
    }
    return 'This action cannot be undone.'
  })()

  const isDeleteOpen =
    (activeTab === 'driver' && Boolean(deleteDriver)) ||
    (activeTab === 'helper' && Boolean(deleteHelper)) ||
    (activeTab === 'office-staff' && Boolean(deleteOfficeStaff))

  const headerMotionProps = animateMobile
    ? {
        variants: mobileHeaderVariants,
        initial: 'hidden' as const,
        animate: 'visible' as const,
      }
    : {}

  const toolbarMotionProps = animateMobile
    ? {
        variants: mobileToolbarVariants,
        initial: 'hidden' as const,
        animate: 'visible' as const,
      }
    : {}

  const tabPanelMotionProps = animateMobile
    ? {
        variants: tabPanelVariants,
        initial: 'hidden' as const,
        animate: 'visible' as const,
        exit: 'exit' as const,
      }
    : {}

  return (
    <section className="space-y-6">
      <motion.header
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-background to-sky-500/10 p-6 shadow-sm"
        {...headerMotionProps}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15"
          animate={
            animateMobile
              ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }
              : undefined
          }
          transition={
            animateMobile
              ? { duration: 6, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10"
          animate={
            animateMobile
              ? { scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }
              : undefined
          }
          transition={
            animateMobile
              ? { duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }
              : undefined
          }
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-400">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Employees</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage drivers, helpers, and office staff — crew records, compliance dates, and identity documents in one
              place.
            </p>
          </div>
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto sm:items-center">
            {isFetching && !isLoading ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing...
              </span>
            ) : null}
            {tabActions.canCreate ? (
              <motion.div
                className="w-full sm:w-auto"
                whileTap={animateMobile ? { scale: 0.97 } : undefined}
                transition={{ type: 'spring', stiffness: 480, damping: 30 }}
              >
                <Button className="w-full sm:w-auto" onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  {tabConfig[activeTab].addLabel}
                </Button>
              </motion.div>
            ) : null}
          </div>
        </div>
      </motion.header>

      <motion.div className="inline-flex flex-wrap rounded-xl border border-border bg-muted/30 p-1" {...toolbarMotionProps}>
        {(Object.keys(tabConfig) as EmployeeTab[]).filter((tab) => tabVisibility[tab]).map((tab) => {
          const config = tabConfig[tab]
          const Icon = config.icon
          return (
            <motion.button
              key={tab}
              type="button"
              onClick={() => setTabParam(tab)}
              whileTap={animateMobile ? { scale: 0.98 } : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </motion.button>
          )
        })}
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'driver' ? (
          <motion.div key="driver-panel" {...tabPanelMotionProps}>
            <EmployeesGrid
              items={sortedDrivers}
              dataColumnDefs={driverDataColumnDefs}
              mobileBadge={driverMobileBadge}
              mobileMeta={driverMobileMeta}
              mobileFields={driverMobileFields}
              mobileSectionTitle={tabConfig.driver.sectionTitle}
              mobileSectionIcon={tabConfig.driver.sectionIcon}
              isLoading={isLoadingDrivers}
              isError={isDriversError}
              error={driversError as Error | null}
              emptyIcon={<SteeringWheelIcon className="ticket-grid-empty__icon" strokeWidth={1.2} />}
              emptyTitle={tabConfig.driver.emptyTitle}
              emptyDescription={tabConfig.driver.emptyDescription}
              canEdit={tabActions.canEdit}
              canDelete={tabActions.canDelete}
              onAdd={tabActions.canCreate ? openAddDialog : undefined}
              emptyAddLabel={tabConfig.driver.addLabel}
              onView={openDriverView}
              onEdit={openDriverEdit}
              onDelete={openDriverDelete}
              skeletonColumnCount={8}
            />
          </motion.div>
        ) : null}

        {activeTab === 'helper' ? (
          <motion.div key="helper-panel" {...tabPanelMotionProps}>
            <EmployeesGrid
              items={sortedHelpers}
              dataColumnDefs={helperDataColumnDefs}
              mobileBadge={helperMobileBadge}
              mobileMeta={helperMobileMeta}
              mobileFields={helperMobileFields}
              mobileSectionTitle={tabConfig.helper.sectionTitle}
              mobileSectionIcon={tabConfig.helper.sectionIcon}
              isLoading={isLoadingHelpers}
              isError={isHelpersError}
              error={helpersError as Error | null}
              emptyIcon={<HardHat className="ticket-grid-empty__icon" strokeWidth={1.2} />}
              emptyTitle={tabConfig.helper.emptyTitle}
              emptyDescription={tabConfig.helper.emptyDescription}
              canEdit={tabActions.canEdit}
              canDelete={tabActions.canDelete}
              onAdd={tabActions.canCreate ? openAddDialog : undefined}
              emptyAddLabel={tabConfig.helper.addLabel}
              onView={openHelperView}
              onEdit={openHelperEdit}
              onDelete={openHelperDelete}
              skeletonColumnCount={6}
            />
          </motion.div>
        ) : null}

        {activeTab === 'office-staff' ? (
          <motion.div key="office-staff-panel" {...tabPanelMotionProps}>
            <EmployeesGrid
              items={sortedOfficeStaff}
              dataColumnDefs={officeStaffDataColumnDefs}
              mobileBadge={officeStaffMobileBadge}
              mobileMeta={officeStaffMobileMeta}
              mobileFields={officeStaffMobileFields}
              mobileSectionTitle={tabConfig['office-staff'].sectionTitle}
              mobileSectionIcon={tabConfig['office-staff'].sectionIcon}
              isLoading={isLoadingOfficeStaff}
              isError={isOfficeStaffError}
              error={officeStaffError as Error | null}
              emptyIcon={<Users className="ticket-grid-empty__icon" strokeWidth={1.2} />}
              emptyTitle={tabConfig['office-staff'].emptyTitle}
              emptyDescription={tabConfig['office-staff'].emptyDescription}
              canEdit={tabActions.canEdit}
              canDelete={tabActions.canDelete}
              onAdd={tabActions.canCreate ? openAddDialog : undefined}
              emptyAddLabel={tabConfig['office-staff'].addLabel}
              onView={openOfficeStaffView}
              onEdit={openOfficeStaffEdit}
              onDelete={openOfficeStaffDelete}
              skeletonColumnCount={6}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DriverFormDialog
        open={isDriverFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingItem={editingDriver}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <HelperFormDialog
        open={isHelperFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingItem={editingHelper}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <OfficeStaffFormDialog
        open={isOfficeStaffFormOpen}
        mode={action === 'edit' ? 'edit' : 'create'}
        editingItem={editingOfficeStaff}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <DriverViewDialog
        open={activeTab === 'driver' && action === 'view' && Boolean(viewingDriver)}
        item={viewingDriver}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <HelperViewDialog
        open={activeTab === 'helper' && action === 'view' && Boolean(viewingHelper)}
        item={viewingHelper}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <OfficeStaffViewDialog
        open={activeTab === 'office-staff' && action === 'view' && Boolean(viewingOfficeStaff)}
        item={viewingOfficeStaff}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      />

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee record?</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="border-red-600 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
