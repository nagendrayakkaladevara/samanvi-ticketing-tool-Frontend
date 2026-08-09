import { describe, expect, it } from 'vitest'

import {
  formatPermissionAction,
  formatPermissionModuleLabel,
  formatPermissionToken,
} from './permission-labels'

describe('formatPermissionToken', () => {
  it('returns General for blank input', () => {
    expect(formatPermissionToken('')).toBe('General')
    expect(formatPermissionToken('   ')).toBe('General')
  })

  it('title-cases snake_case and kebab-case tokens', () => {
    expect(formatPermissionToken('repair_job')).toBe('Repair Job')
    expect(formatPermissionToken('issue-category')).toBe('Issue Category')
  })
})

describe('formatPermissionModuleLabel', () => {
  it('uses override for users module', () => {
    expect(formatPermissionModuleLabel('users')).toBe('Application Access')
  })

  it('uses trimmed fallback when provided', () => {
    expect(formatPermissionModuleLabel('custom', '  Custom Label  ')).toBe('Custom Label')
  })

  it('falls back to formatPermissionToken for unknown modules', () => {
    expect(formatPermissionModuleLabel('repair_tracking')).toBe('Repair Tracking')
  })
})

describe('formatPermissionAction', () => {
  it('delegates to formatPermissionToken', () => {
    expect(formatPermissionAction('create')).toBe('Create')
  })
})
