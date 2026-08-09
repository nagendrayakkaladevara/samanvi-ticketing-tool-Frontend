import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairCategoryNode } from '@/test/fixtures/garage'

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

import { RepairCategoryPicker } from './repair-category-picker'

describe('RepairCategoryPicker', () => {
  it('renders category picker with tree', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const tree = [makeRepairCategoryNode({ id: 'cat-1', name: 'Brakes' })]

    render(
      <RepairCategoryPicker tree={tree} value="" onValueChange={onValueChange} placeholder="Select category" />,
    )

    await user.click(screen.getByText('Select category'))
    await user.click(screen.getByRole('menuitem', { name: 'Brakes' }))
    expect(onValueChange).toHaveBeenCalledWith('cat-1')
  })
})
