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
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
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

    it('passes only days when status omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      await ticketsService.list({ days: 14 })

      expect(apiClient.get).toHaveBeenCalledWith('/tickets', { params: { days: 14 } })
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
    it('extracts tickets from nested data shapes', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [{ ...baseTicket, id: 't-data' }] } })
      expect((await ticketsService.list())[0]?.id).toBe('t-data')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { tickets: [{ ...baseTicket, id: 't-nested' }] } },
      })
      expect((await ticketsService.list())[0]?.id).toBe('t-nested')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { items: [{ ...baseTicket, id: 't-items' }] } },
      })
      expect((await ticketsService.list())[0]?.id).toBe('t-items')

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { tickets: [{ ...baseTicket, id: 't-top' }] } })
      expect((await ticketsService.list())[0]?.id).toBe('t-top')
    })

    it('extracts timeline from nested activityLogs', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { activityLogs: [{ id: 'e1', action: 'note', createdAt: '2024-01-01' }] } },
      })
      expect((await ticketsService.getTimeline('t1'))[0]?.id).toBe('e1')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { activityLogs: [{ id: 'e2', event: 'custom', createdAt: '2024-01-02' }] },
      })
      expect((await ticketsService.getTimeline('t1'))[0]?.action).toBe('custom')
    })

    it('extracts categories from nested payload keys', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { categories: [{ id: 'c1', label: 'Body' }] } },
      })
      expect((await ticketsService.listIssueCategories())[0]).toEqual({
        id: 'c1',
        name: 'Body',
        isActive: true,
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { categories: [{ issueCategoryId: 'c2', title: 'Fuel' }] },
      })
      expect((await ticketsService.listIssueCategories())[0]?.name).toBe('Fuel')
    })

    it('normalizes blocked status and remaining bus or person aliases', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            id: 't-blocked',
            title: 'Blocked',
            status: 'BLOCKED',
            bus_number_plate: 'PLATE-1',
            createdByDisplayName: 'Creator',
            assigneeName: 'Assignee',
            assignedToId: 'w5',
          },
        ],
      })
      const [ticket] = await ticketsService.list()
      expect(ticket).toMatchObject({
        status: 'BLOCKED',
        busNumber: 'PLATE-1',
        createdByName: 'Creator',
        assignedToName: 'Assignee',
        assignedToUserId: 'w5',
      })
    })

    it('getPersonDisplayName handles string names and empty person objects', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            id: 't1',
            title: 'String creator',
            createdBy: '  Named  ',
            assignedToUser: '  ',
          },
        ],
      })
      const [ticket] = await ticketsService.list()
      expect(ticket?.createdByName).toBe('Named')
      expect(ticket?.assignedToName).toBeUndefined()
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

    it('tolerates malformed ticket payloads across endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [
          null,
          { id: 't-bad' },
          {
            id: 't-full',
            title: 'Full',
            status: 'blocked',
            severity: 'medium',
            priority: 'p2',
            bus_number_plate: 'PLATE-1',
            createdByUser: 'Creator',
            assignee: 'Assignee',
            assignedToId: 'w1',
          },
        ],
      })
      const [ticket] = await ticketsService.list()
      expect(ticket?.busNumber).toBe('PLATE-1')
      expect(ticket?.createdByName).toBe('Creator')
      expect(ticket?.assignedToName).toBe('Assignee')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { activityLogs: [{ actionType: 'assigned', actor: { username: 'u1' } }] },
      })
      const [timelineEntry] = await ticketsService.getTimeline('t1')
      expect(timelineEntry.action).toBe('assigned')
      expect(timelineEntry.actorUsername).toBe('u1')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [{ id: 'w1', displayName: 'Worker', role: 'ADMIN' }],
      })
      expect((await ticketsService.listAssignableUsers())[0]?.role).toBe('ADMIN')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { categories: [{ issueCategoryId: 8, label: 'Body' }] } },
      })
      expect((await ticketsService.listIssueCategories())[0]?.name).toBe('Body')
    })

    it('handles non-object person candidates and name composition', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [
          {
            id: 't-num',
            title: 'Numeric person',
            createdBy: 42,
            assignedToUsername: 'Named User',
          },
          {
            id: 't-fl',
            title: 'First last',
            createdBy: { firstName: 'OnlyFirst', lastName: '' },
            assignedTo: { firstName: 'A', lastName: 'B' },
          },
        ],
      })
      const tickets = await ticketsService.list()
      expect(tickets[0]?.createdByName).toBeUndefined()
      expect(tickets[0]?.assignedToName).toBe('Named User')
      expect(tickets[1]?.createdByName).toBe('OnlyFirst')
      expect(tickets[1]?.assignedToName).toBe('A B')
    })

    it('returns empty arrays for non-array ticket payloads', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { foo: 'bar' } })
      expect(await ticketsService.list()).toEqual([])
    })

    it('covers alternate ticket field keys and invalid person shapes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          {
            ticketId: 'alt-1',
            title: 'Alt keys',
            ticket_no: 'TN-9',
            bus_number: 'BN-1',
            status: true,
            severity: 'unknown',
            priority: 'nope',
            category: 12,
            slaDueAt: 99,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            createdBy: { displayName: '  ' },
            assignedTo: { name: '  ' },
            createdById: 'c1',
            assignedToUserId: 'a1',
          },
          {
            id: 'alt-2',
            title: 'Bus object',
            bus: { busNumber: 'FROM-BUS' },
            createdBy: { username: 'creator' },
            assignedTo: { username: 'assignee' },
            ticketNumber: 77,
          },
          {
            id: 'alt-3',
            title: 'Bus no key',
            busNo: 'NO-KEY',
            createdBy: { firstName: '', lastName: '' },
            assignedTo: null,
          },
          {
            id: 'alt-4',
            title: 'Whitespace names',
            createdBy: '   ',
            assignedToUsername: '   ',
          },
        ],
      })

      const tickets = await ticketsService.list()
      expect(tickets).toHaveLength(4)
      expect(tickets[0]).toMatchObject({
        id: 'alt-1',
        ticketNumber: 'TN-9',
        busNumber: 'BN-1',
        status: 'CREATED',
        severity: 'LOW',
        priority: 'P3',
        category: 'General',
        slaDueAt: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      })
      expect(tickets[1]?.ticketNumber).toBe('77')
      expect(tickets[1]?.busNumber).toBe('FROM-BUS')
      expect(tickets[1]?.createdByName).toBe('creator')
      expect(tickets[2]?.busNumber).toBe('NO-KEY')
      expect(tickets[2]?.createdByName).toBeUndefined()
      expect(tickets[3]?.createdByName).toBeUndefined()
    })

    it('covers timeline alternate id and actor fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          { eventId: 'e1', type: 'note', actor: { displayName: 'Act' }, timestamp: '2024-02-01' },
          { activityId: 'a1', actionType: 'closed', actorUsername: 'tech' },
          { id: 'x1', note: 'n', actor: true, createdAt: 1 },
        ],
      })
      const entries = await ticketsService.getTimeline('t1')
      expect(entries[0]?.id).toBe('e1')
      expect(entries[0]?.action).toBe('note')
      expect(entries[0]?.actorName).toBe('Act')
      expect(entries[0]?.createdAt).toBe('2024-02-01')
      expect(entries[1]?.id).toBe('a1')
      expect(entries[1]?.action).toBe('closed')
      expect(entries[2]?.id).toBe('x1')
    })

    it('covers assignable user and category alternate keys', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            items: [
              { _id: 'w2', name: 'Worker Two', roleCode: 'supervisor' },
              { userId: 'w3', fullName: 'Worker Three', role: 'not-a-role' },
              { id: 'w4', username: 'num' },
              null,
            ],
          },
        },
      })
      const users = await ticketsService.listAssignableUsers()
      expect(users.map((u) => u.id)).toEqual(['w2', 'w3', 'w4'])
      expect(users[0]?.role).toBe('SUPERVISOR')
      expect(users[1]?.role).toBe('VIEWER')

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [{ categoryId: 'c9', title: 'Cat Title' }, { id: 'c10' }, 'bad'],
      })
      const categories = await ticketsService.listIssueCategories()
      expect(categories[0]).toMatchObject({ id: 'c9', name: 'Cat Title' })
    })
  })
})
