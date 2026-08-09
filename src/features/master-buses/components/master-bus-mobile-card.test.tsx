vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeMasterBus } from '@/test/fixtures/masters'
import { toMasterBusGridRow } from '@/features/master-buses/utils/master-bus-model'

import { MasterBusMobileCard, MasterBusMobileCardSkeleton } from './master-bus-mobile-card'

describe('MasterBusMobileCard', () => {
  it('renders bus number and edit action', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const row = toMasterBusGridRow(makeMasterBus({ busNumber: 'BUS-99' }))

    render(<MasterBusMobileCard row={row} canEdit onEdit={onEdit} />)

    expect(screen.getByText('BUS-99')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Edit/i }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('renders skeleton', () => {
    const { container } = render(<MasterBusMobileCardSkeleton />)
    expect(container.querySelector('.master-bus-mobile-card--skeleton')).toBeInTheDocument()
  })
})
