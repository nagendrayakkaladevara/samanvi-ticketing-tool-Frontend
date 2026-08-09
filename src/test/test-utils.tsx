import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

type ProviderOptions = {
  queryClient?: QueryClient
  initialEntries?: string[]
}

export function createWrapper({ queryClient, initialEntries = ['/'] }: ProviderOptions = {}) {
  const client = queryClient ?? createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(ui: ReactElement, options?: ProviderOptions & Omit<RenderOptions, 'wrapper'>) {
  const { queryClient, initialEntries, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: createWrapper({ queryClient, initialEntries }),
    ...renderOptions,
  })
}
