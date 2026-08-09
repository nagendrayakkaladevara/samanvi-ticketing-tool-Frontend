import { describe, expect, it } from 'vitest'

import { getCreateTicketPath, getTicketDetailsPath } from './ticket-routes'

describe('ticket-routes', () => {
  it('builds ticket details path', () => {
    expect(getTicketDetailsPath('abc-123')).toBe('/tickets/abc-123')
  })

  it('builds create ticket path', () => {
    expect(getCreateTicketPath()).toBe('/tickets/create')
  })
})
