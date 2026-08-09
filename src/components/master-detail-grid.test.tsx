import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MasterDetailGrid } from './master-detail-grid'

describe('MasterDetailGrid', () => {
  it('renders children in a grid container', () => {
    render(
      <MasterDetailGrid>
        <span>Field A</span>
        <span>Field B</span>
      </MasterDetailGrid>,
    )

    expect(screen.getByText('Field A')).toBeInTheDocument()
    expect(screen.getByText('Field B')).toBeInTheDocument()
  })
})
