import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'

import { ticketsService } from './tickets.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const baseTicket = {
  id: 't1',
  title: 'Test ticket',
  status: 'created',
  severity: 'low',
  priority: 'p3',
}

describe('ticketsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('fetches tickets without params by default', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [baseTicket] })

      const tickets = await ticketsService.list()

      expect(apiClient.get).toHaveBeenCalledWith('/tickets', {})
      expect(tickets[0]?.status).toBe('CREATED')
    })

    it('passes status and days query params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      await ticketsService.list({ status: 'open', days: 7 })

      expect(apiClient.get).toHaveBeenCalledWith('/tickets', { params: { status: 'open', days: 7 } })
    })

    it('normalizes nested tickets array and alternate keys', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            tickets: [
              {
                ticketId: 't2',
                title: 'Nested',
                status: 'in_progress',
                bus_number: 'BUS-9',
                ticket_no: 'TN-9',
                created_at: '2024-01-01',
                createdBy: { firstName: 'Jane', lastName: 'Doe' },
                assignedTo: { userId: 'w1', username: 'worker1' },
              },
            ],
          },
        },
      })

      const [ticket] = await ticketsService.list()

      expect(ticket).toMatchObject({
        id: 't2',
        status: 'IN_PROGRESS',
        busNumber: 'BUS-9',
        ticketNumber: 'TN-9',
        createdByName: 'Jane Doe',
        assignedToName: 'worker1',
        assignedToUserId: 'w1',
      })
    })

    it('defaults unknown status to CREATED', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ ...baseTicket, status: 'bogus' }],
      })

      const [ticket] = await ticketsService.list()
      expect(ticket?.status).toBe('CREATED')
    })
  })

  describe('getById', () => {
    it('unwraps nested data payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: baseTicket } })

      const ticket = await ticketsService.getById('t1')
      expect(ticket.id).toBe('t1')
    })
  })

  describe('searchByTicketNumber', () => {
    it('searches with ticketNumber param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: baseTicket })

      await ticketsService.searchByTicketNumber('TN-1')

      expect(apiClient.get).toHaveBeenCalledWith('/tickets/search', { params: { ticketNumber: 'TN-1' } })
    })
  })

  describe('updateStatus', () => {
    it.each([
      ['ASSIGNED', 'assigned'],
      ['IN_PROGRESS', 'in_progress'],
      ['RESOLVED', 'resolved'],
      ['CLOSED', 'closed'],
      ['REOPENED', 'reopened'],
    ] as const)('maps UI status %s to API %s', async (uiStatus, apiStatus) => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...baseTicket, status: apiStatus } })

      await ticketsService.updateStatus({ ticketId: 't1', status: uiStatus, note: '  note  ' })

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/t1/status', {
        status: apiStatus,
        note: 'note',
      })
    })

    it('omits blank note', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: baseTicket })

      await ticketsService.updateStatus({ ticketId: 't1', status: 'ASSIGNED', note: '   ' })

      expect(apiClient.patch).toHaveBeenCalledWith('/tickets/t1/status', { status: 'assigned' })
    })
  })

  describe('getTimeline', () => {
    it('normalizes timeline entries with alternate keys', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          activityLogs: [
            {
              eventId: 'e1',
              type: 'status_change',
              comment: 'Updated',
              actor: { displayName: 'Admin' },
              timestamp: '2024-01-01',
            },
          ],
        },
      })

      const entries = await ticketsService.getTimeline('t1')

      expect(entries[0]).toMatchObject({
        id: 'e1',
        action: 'status_change',
        note: 'Updated',
        actorName: 'Admin',
        createdAt: '2024-01-01',
      })
    })
  })

  describe('assign', () => {
    it('posts assignment with optional note', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: baseTicket })

      await ticketsService.assign({ ticketId: 't1', assignedToId: 'w1', note: 'assign' })

      expect(apiClient.post).toHaveBeenCalledWith('/tickets/t1/assign', {
        assignedToId: 'w1',
        note: 'assign',
      })
    })
  })

  describe('addComment', () => {
    it('posts trimmed comment', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({})

      await ticketsService.addComment({ ticketId: 't1', note: '  hello  ' })

      expect(apiClient.post).toHaveBeenCalledWith('/tickets/t1/comments', { note: 'hello' })
    })
  })

  describe('listAssignableUsers', () => {
    it('normalizes workers from /workers', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ userId: 'w1', name: 'Worker', roleCode: 'SUPERVISOR' }],
      })

      const users = await ticketsService.listAssignableUsers()

      expect(apiClient.get).toHaveBeenCalledWith('/workers')
      expect(users[0]).toEqual({ id: 'w1', displayName: 'Worker', role: 'SUPERVISOR' })
    })

    it('defaults unknown role to VIEWER', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: 'w2', username: 'viewer', role: 'guest' }],
      })

      const [user] = await ticketsService.listAssignableUsers()
      expect(user?.role).toBe('VIEWER')
    })
  })

  describe('listIssueCategories', () => {
    it('normalizes categories with alternate id/name keys', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ categoryId: 'c1', categoryName: 'Electrical' }],
      })

      const categories = await ticketsService.listIssueCategories()

      expect(apiClient.get).toHaveBeenCalledWith('/issue-categories')
      expect(categories[0]).toEqual({ id: 'c1', name: 'Electrical', isActive: true })
    })
  })

  describe('create', () => {
    it('posts create payload', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: baseTicket })

      const input = {
        title: 'New',
        description: 'Desc',
        severity: 'medium' as const,
        priority: 'p2' as const,
        categoryId: 'c1',
        busNumber: 'BUS-1',
        slaDueAt: '2024-01-01T00:00:00.000Z',
      }

      await ticketsService.create(input)

      expect(apiClient.post).toHaveBeenCalledWith('/tickets', input)
    })
  })

  describe('enhanceDescription', () => {
    it('returns enhanced text from AI endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { enhancedText: '  Improved description  ' } },
      })

      const result = await ticketsService.enhanceDescription('raw')

      expect(apiClient.post).toHaveBeenCalledWith(
        '/ai/enhance-ticket-description',
        { description: 'raw' },
        { timeout: 30_000 },
      )
      expect(result).toBe('  Improved description  ')
    })

    it('throws when AI returns empty text', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { enhancedText: '   ' } } })

      await expect(ticketsService.enhanceDescription('raw')).rejects.toThrow(
        'AI enhancement returned empty text.',
      )
    })
  })

  describe('remove', () => {
    it('deletes ticket by id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})

      await ticketsService.remove('t1')

      expect(apiClient.delete).toHaveBeenCalledWith('/tickets/t1')
    })
  })

  describe('normalization and payload extraction', () => {
    it('extracts tickets from all nested array shapes', async () => {
      const payloads = [
        { data: [{ ...baseTicket, id: 't-data' }] },
        { data: { tickets: [{ ...baseTicket, id: 't-nested' }] } },
        { data: { items: [{ ...baseTicket, id: 't-items' }] } },
        { tickets: [{ ...baseTicket, id: 't-top' }] },
        { items: [{ ...baseTicket, id: 't-items-top' }] },
      ]

      for (const data of payloads) {
        vi.mocked(apiClient.get).mockResolvedValueOnce({ data })
        const [ticket] = await ticketsService.list()
        expect(ticket?.id).toMatch(/^t-/)
      }
    })

    it('normalizes ticket bus number and person name fallbacks', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            id: 't-bus',
            title: 'Bus variants',
            busNo: 'BUS-A',
            ticketNumber: 42,
            severity: 'critical',
            priority: 'p1',
            createdByName: '  Named Creator  ',
            assignedTo: { _id: 'w9', name: 'Assignee' },
          },
        ],
      })
      const [ticket] = await ticketsService.list()
      expect(ticket).toMatchObject({
        busNumber: 'BUS-A',
        ticketNumber: '42',
        severity: 'CRITICAL',
        priority: 'P1',
        createdByName: 'Named Creator',
        assignedToName: 'Assignee',
        assignedToUserId: 'w9',
      })
    })

    it('getPersonDisplayName handles string and first/last name objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          activityLogs: [
            {
              id: 'e1',
              action: 'note',
              user: { firstName: 'John', lastName: 'Smith' },
              timestamp: '2024-01-01',
            },
          ],
        },
      })
      const entries = await ticketsService.getTimeline('t1')
      expect(entries[0]?.actorName).toBe('John Smith')
    })

    it('listIssueCategories extracts nested issueCategories and numeric ids', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { issueCategories: [{ categoryId: 3, title: 'Fuel' }] } },
      })
      expect((await ticketsService.listIssueCategories())[0]).toEqual({
        id: '3',
        name: 'Fuel',
        isActive: true,
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { categories: [{ id: 'c2', label: 'Body', isActive: false }] } },
      })
      expect((await ticketsService.listIssueCategories())[0]).toMatchObject({
        id: 'c2',
        name: 'Body',
        isActive: false,
      })
    })

    it('getById and search fall back to raw payload when normalize fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: { id: 'raw' } } })
      expect(await ticketsService.getById('raw')).toEqual({ id: 'raw' })

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'search-raw' } })
      expect(await ticketsService.searchByTicketNumber('TN')).toEqual({ id: 'search-raw' })
    })

    it('assign omits blank note', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: baseTicket })
      await ticketsService.assign({ ticketId: 't1', assignedToId: 'w1', note: '   ' })
      expect(apiClient.post).toHaveBeenCalledWith('/tickets/t1/assign', { assignedToId: 'w1' })
    })

    it('timeline generates id when missing and uses event alias', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ event: 'custom', actorUsername: 'tech', createdAt: '2024-01-01' }],
      })
      const [entry] = await ticketsService.getTimeline('t1')
      expect(entry.action).toBe('custom')
      expect(entry.actorUsername).toBe('tech')
      expect(entry.id).toMatch(/^timeline-/)
    })
  })
})
