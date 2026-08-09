import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/pwa/hooks/use-pwa-install', () => ({
  isIosSafari: () => false,
  usePwaInstall: () => ({
    showIosGuide: false,
    install: vi.fn(),
    isInstalling: false,
    canInstall: true,
    isInstalled: false,
  }),
}))

import { PwaInstallSettingsSection } from './PwaInstallSettingsSection'

describe('PwaInstallSettingsSection', () => {
  it('renders install settings section', () => {
    render(<PwaInstallSettingsSection />)
    expect(screen.getAllByText('Install app').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Install app' })).toBeInTheDocument()
  })
})
