import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildTicketShareMessage,
  getTicketShareDisplayId,
  getTicketShareUrl,
  getWhatsAppShareUrl,
  shareTicketViaWhatsApp,
} from './ticket-share'

describe('getTicketShareDisplayId', () => {
  it('prefers trimmed ticket number', () => {
    expect(getTicketShareDisplayId('id-1', '  T-100  ')).toBe('T-100')
  })

  it('falls back to ticket id', () => {
    expect(getTicketShareDisplayId('id-1')).toBe('id-1')
    expect(getTicketShareDisplayId('id-1', '   ')).toBe('id-1')
  })
})

describe('getTicketShareUrl', () => {
  it('builds absolute url with origin', () => {
    expect(getTicketShareUrl('id-1', 'https://example.com')).toBe('https://example.com/tickets/id-1')
  })
})

describe('buildTicketShareMessage', () => {
  it('includes display id, title, and url', () => {
    const message = buildTicketShareMessage(
      { ticketId: 'id-1', ticketNumber: 'T-1', title: 'Broken AC' },
      'https://example.com',
    )

    expect(message).toContain('Ticket ID: T-1')
    expect(message).toContain('Title: Broken AC')
    expect(message).toContain('https://example.com/tickets/id-1')
  })
})

describe('getWhatsAppShareUrl', () => {
  it('encodes message for wa.me', () => {
    expect(getWhatsAppShareUrl('hello world')).toBe('https://wa.me/?text=hello%20world')
  })
})

describe('shareTicketViaWhatsApp', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('opens whatsapp share url in new tab', () => {
    shareTicketViaWhatsApp({ ticketId: 'id-1', title: 'Test' })

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank',
      'noopener,noreferrer',
    )
  })
})
