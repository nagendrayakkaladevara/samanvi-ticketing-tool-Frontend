import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('resolves conflicting tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'block')).toBe('base block')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('ignores nullish and boolean inputs', () => {
    expect(cn(undefined, null, false, 'visible')).toBe('visible')
  })
})
