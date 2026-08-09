import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const dismiss = vi.fn()
const install = vi.fn()

vi.mock('@/features/pwa/hooks/use-pwa-install', () => ({
  usePwaInstall: () => ({
    canShow: true,
    showIosGuide: false,
    install,
    dismiss,
    isInstalling: false,
    canInstall: true,
  }),
}))

import { PwaInstallBanner } from './PwaInstallBanner'

describe('PwaInstallBanner', () => {
  it('renders install banner and handles actions', async () => {
    const user = userEvent.setup()

    render(<PwaInstallBanner />)

    expect(screen.getByRole('region', { name: 'Install app' })).toBeInTheDocument()
    expect(screen.getByText('Install Samanvi')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Install app' }))
    expect(install).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Dismiss install banner' }))
    expect(dismiss).toHaveBeenCalled()
  })
})
