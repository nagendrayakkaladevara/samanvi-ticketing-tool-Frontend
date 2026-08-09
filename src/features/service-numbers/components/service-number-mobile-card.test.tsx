vi.mock('framer-motion', () => import('@/test/mocks/framer-motion'))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'

import { ServiceNumberMobileCard, ServiceNumberMobileCardSkeleton } from './service-number-mobile-card'

describe('ServiceNumberMobileCard', () => {
  it('renders service number details', () => {
    render(
      <ServiceNumberMobileCard
        item={makeServiceNumber({ serviceNo: '101', from: 'City A', to: 'City B' })}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText(/City A/)).toBeInTheDocument()
  })

  it('renders skeleton', () => {
    const { container } = render(<ServiceNumberMobileCardSkeleton />)
    expect(container.querySelector('.service-number-mobile-card--skeleton')).toBeInTheDocument()
  })
})
