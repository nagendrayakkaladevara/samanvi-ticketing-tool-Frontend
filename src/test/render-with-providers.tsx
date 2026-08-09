import { render, renderHook, type RenderHookOptions, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import { createWrapper } from '@/test/test-utils'

type ProviderOptions = {
  route?: string
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions & ProviderOptions) {
  const { route = '/', ...renderOptions } = options ?? {}
  return render(ui, { wrapper: createWrapper({ initialEntries: [route] }), ...renderOptions })
}

export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options?: RenderHookOptions<Props> & ProviderOptions,
) {
  const { route = '/', ...hookOptions } = options ?? {}
  return renderHook(hook, { wrapper: createWrapper({ initialEntries: [route] }), ...hookOptions })
}
