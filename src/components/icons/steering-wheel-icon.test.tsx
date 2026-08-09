import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SteeringWheelIcon } from './steering-wheel-icon'

describe('SteeringWheelIcon', () => {
  it('renders an svg icon', () => {
    const { container } = render(<SteeringWheelIcon className="h-4 w-4" aria-hidden />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
