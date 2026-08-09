import { describe, expect, it } from 'vitest'

import { invalidFieldClass } from './form-field-styles'

describe('form-field-styles', () => {
  it('exports invalid field class string with red border styling', () => {
    expect(invalidFieldClass).toContain('border-red-500')
    expect(invalidFieldClass).toContain('dark:border-red-400')
  })
})
