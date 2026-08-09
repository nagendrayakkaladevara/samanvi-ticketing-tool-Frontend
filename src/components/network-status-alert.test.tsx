import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NetworkStatusAlert } from './network-status-alert'

const useNetworkStatusMock = vi.fn()

vi.mock('@/hooks/use-network-status', () => ({
  RECONNECTED_VISIBLE_MS: 4000,
  useNetworkStatus: () => useNetworkStatusMock(),
}))

vi.mock('framer-motion', async () => {
  const React = await import('react')
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
      span: ({ children, ...props }: React.ComponentProps<'span'>) => <span {...props}>{children}</span>,
    },
    useReducedMotion: () => true,
  }
})

describe('NetworkStatusAlert', () => {
  beforeEach(() => {
    useNetworkStatusMock.mockReturnValue({ isOnline: true, showReconnected: false })
  })

  it('renders nothing when online and not showing reconnected banner', () => {
    render(<NetworkStatusAlert />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows offline alert when disconnected', () => {
    useNetworkStatusMock.mockReturnValue({ isOnline: false, showReconnected: false })

    render(<NetworkStatusAlert />)

    expect(screen.getByText('You are offline')).toBeInTheDocument()
    expect(screen.getByText('Changes may not save until your connection is restored.')).toBeInTheDocument()
  })

  it('shows reconnected alert when back online', () => {
    useNetworkStatusMock.mockReturnValue({ isOnline: true, showReconnected: true })

    render(<NetworkStatusAlert />)

    expect(screen.getByText('Back online')).toBeInTheDocument()
    expect(screen.getByText('Your internet connection has been restored.')).toBeInTheDocument()
  })
})
