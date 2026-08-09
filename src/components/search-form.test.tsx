import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SearchForm } from './search-form'

vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInput: (props: React.ComponentProps<'input'>) => <input {...props} />,
}))

describe('SearchForm', () => {
  it('renders accessible search input with placeholder', () => {
    render(<SearchForm />)

    const input = screen.getByLabelText('Search')
    expect(input).toHaveAttribute('placeholder', 'Search the docs...')
    expect(input).toHaveAttribute('id', 'search')
  })

  it('forwards form props', () => {
    render(<SearchForm data-testid="search-form" />)
    expect(screen.getByTestId('search-form')).toBeInTheDocument()
  })
})
