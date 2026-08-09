import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MasterDateCell, MasterDateDisplay } from './master-date-display'

describe('MasterDateDisplay', () => {
  it('renders label text', () => {
    render(<MasterDateDisplay label="01-01-2025" dateValue="01-01-2025" />)
    expect(screen.getByText('01-01-2025')).toBeInTheDocument()
  })
})

describe('MasterDateCell', () => {
  it('renders muted placeholder for empty values', () => {
    render(<MasterDateCell label="—" dateValue={null} />)
    expect(screen.getByText('—')).toHaveClass('text-muted-foreground')
  })
})
