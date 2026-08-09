import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, type RenderHookOptions, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

type ProviderOptions = {
  route?: string
}

function createWrapper({ route = '/' }: ProviderOptions = {}) {
  const queryClient = createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions & ProviderOptions) {
  const { route, ...renderOptions } = options ?? {}
  return render(ui, { wrapper: createWrapper({ route }), ...renderOptions })
}

export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options?: RenderHookOptions<Props> & ProviderOptions,
) {
  const { route, ...hookOptions } = options ?? {}
  return renderHook(hook, { wrapper: createWrapper({ route }), ...hookOptions })
}
