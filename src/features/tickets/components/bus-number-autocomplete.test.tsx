import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/buses/hooks/use-bus-numbers-query', () => ({
  useBusNumbersQuery: () => ({ data: ['BUS-01', 'BUS-02'] }),
}))
vi.mock('@/features/master-buses/hooks/use-master-buses-query', () => ({
  useMasterBusNumbersQuery: () => ({ data: ['BUS-99'] }),
}))

import { BusNumberAutocomplete } from './bus-number-autocomplete'

function AutocompleteHarness() {
  const [value, setValue] = useState('')
  return <BusNumberAutocomplete value={value} onChange={setValue} placeholder="Bus number" />
}

describe('BusNumberAutocomplete', () => {
  it('filters and selects bus numbers', async () => {
    const user = userEvent.setup()

    render(<AutocompleteHarness />)

    const input = screen.getByPlaceholderText('Bus number')
    await user.type(input, 'BUS-0')
    await user.click(screen.getByRole('option', { name: 'BUS-01' }))

    expect(input).toHaveValue('BUS-01')
  })
})
