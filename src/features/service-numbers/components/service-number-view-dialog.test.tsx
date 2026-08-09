import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeServiceNumber } from '@/test/fixtures/masters'

import { ServiceNumberViewDialog } from './service-number-view-dialog'

describe('ServiceNumberViewDialog', () => {
  it('renders service number details', () => {
    render(
      <ServiceNumberViewDialog
        open
        item={makeServiceNumber({ serviceNo: '202', from: 'North', to: 'South' })}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '202' })).toBeInTheDocument()
    expect(screen.getByText('North')).toBeInTheDocument()
  })
})
