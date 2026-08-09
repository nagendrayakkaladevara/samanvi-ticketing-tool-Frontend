import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { VersionSwitcher } from './version-switcher'

describe('VersionSwitcher', () => {
  it('renders default version and allows switching', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <VersionSwitcher versions={['1.0.0', '2.0.0']} defaultVersion="1.0.0" />
      </SidebarProvider>,
    )

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Documentation/i }))
    await user.click(screen.getByRole('menuitem', { name: /v2.0.0/ }))

    expect(screen.getByText('v2.0.0')).toBeInTheDocument()
  })
})
