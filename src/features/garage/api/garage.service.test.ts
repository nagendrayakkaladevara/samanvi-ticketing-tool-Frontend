import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '@/lib/api/client'
import { collectLeafRepairCategories, garageService } from './garage.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const minimalJobPayload = {
  id: 'job-1',
  jobIdNumber: 'RJ-001',
  description: 'Fix brakes',
  priority: 'medium',
  status: 'in_progress',
  odometerReading: 1000,
  bus: { id: 'bus-1', busNumber: 'BUS-01' },
  repairCategory: { id: 'cat-1', name: 'Brakes', level: 1 },
  createdBy: { id: 'u1', username: 'admin', displayName: 'Admin' },
}

describe('collectLeafRepairCategories', () => {
  it('collects only leaf nodes with path labels', () => {
    const tree = [
      {
        id: 'root',
        name: 'Root',
        level: 1,
        parentId: null,
        createdAt: '',
        updatedAt: '',
        children: [
          {
            id: 'leaf',
            name: 'Leaf',
            level: 2,
            parentId: 'root',
            createdAt: '',
            updatedAt: '',
            children: [],
          },
        ],
      },
    ]

    expect(collectLeafRepairCategories(tree)).toEqual([
      { id: 'leaf', label: 'Root › Leaf', level: 2 },
    ])
  })
})

describe('garageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listRepairCategories', () => {
    it('normalizes items and tree from nested payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            items: [{ id: 'c1', name: 'Cat', level: 1 }],
            tree: [{ id: 'c1', name: 'Cat', level: 1, children: [] }],
          },
        },
      })

      const result = await garageService.listRepairCategories()

      expect(apiClient.get).toHaveBeenCalledWith('/garage/masters/repair-categories')
      expect(result.items).toHaveLength(1)
      expect(result.tree).toHaveLength(1)
    })
  })

  describe('createRepairCategory', () => {
    it('posts trimmed name and optional parentId', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { id: 'c1', name: 'New', level: 1 } },
      })

      const result = await garageService.createRepairCategory({ name: '  New  ', parentId: ' p1 ' })

      expect(apiClient.post).toHaveBeenCalledWith('/garage/masters/repair-categories', {
        name: 'New',
        parentId: 'p1',
      })
      expect(result.name).toBe('New')
    })

    it('throws when response cannot be normalized', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { id: '' } } })
      await expect(garageService.createRepairCategory({ name: 'X' })).rejects.toThrow(
        'Unexpected response when creating repair category.',
      )
    })
  })

  describe('updateRepairCategory', () => {
    it('patches category name', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { data: { id: 'c1', name: 'Updated', level: 1 } },
      })

      const result = await garageService.updateRepairCategory('c1', '  Updated  ')
      expect(apiClient.patch).toHaveBeenCalledWith('/garage/masters/repair-categories/c1', {
        name: 'Updated',
      })
      expect(result.name).toBe('Updated')
    })
  })

  describe('deleteRepairCategory', () => {
    it('calls delete endpoint', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})
      await garageService.deleteRepairCategory('c1')
      expect(apiClient.delete).toHaveBeenCalledWith('/garage/masters/repair-categories/c1')
    })
  })

  describe('listRepairParts', () => {
    it('normalizes parts with numeric price', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [{ id: 'p1', partName: 'Filter', price: 25.5 }],
      })

      const parts = await garageService.listRepairParts({ page: 2, limit: 10 })
      expect(apiClient.get).toHaveBeenCalledWith('/garage/masters/repair-parts', {
        params: { page: 2, limit: 10 },
      })
      expect(parts[0]?.price).toBe('25.50')
    })
  })

  describe('createRepairPart', () => {
    it('posts trimmed fields and optional description', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { id: 'p1', partName: 'Filter', price: '10.00', description: null } },
      })

      await garageService.createRepairPart({
        partName: '  Filter  ',
        price: '10.00',
        description: '  desc  ',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/garage/masters/repair-parts', {
        partName: 'Filter',
        price: '10.00',
        description: 'desc',
      })
    })
  })

  describe('updateRepairPart', () => {
    it('patches provided fields', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { data: { id: 'p1', partName: 'New', price: '11.00' } },
      })

      await garageService.updateRepairPart({
        partId: 'p1',
        partName: ' New ',
        price: '11.00',
        description: null,
      })

      expect(apiClient.patch).toHaveBeenCalledWith('/garage/masters/repair-parts/p1', {
        partName: 'New',
        price: '11.00',
        description: null,
      })
    })
  })

  describe('listJobs', () => {
    it('normalizes jobs with status spaces to underscores', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          items: [{ ...minimalJobPayload, status: 'in progress' }],
        },
      })

      const jobs = await garageService.listJobs()
      expect(jobs[0]?.status).toBe('in_progress')
    })

    it('filters invalid jobs', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [null, { id: '' }] })
      expect(await garageService.listJobs()).toEqual([])
    })
  })

  describe('getJob', () => {
    it('returns normalized job', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: minimalJobPayload } })
      const job = await garageService.getJob('job-1')
      expect(job.id).toBe('job-1')
    })

    it('throws when job not found', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: null } })
      await expect(garageService.getJob('missing')).rejects.toThrow('Repair job not found.')
    })
  })

  describe('getJobTimeline', () => {
    it('returns timeline with activity logs', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          data: {
            jobId: 'job-1',
            items: [
              {
                id: 'log-1',
                actionType: 'commented',
                createdAt: '2024-01-01T00:00:00Z',
                actor: { id: 'u1', username: 'a', displayName: 'A' },
              },
            ],
          },
        },
      })

      const timeline = await garageService.getJobTimeline('job-1')
      expect(timeline.jobId).toBe('job-1')
      expect(timeline.items).toHaveLength(1)
    })
  })

  describe('updateJob', () => {
    it('builds patch payload from input', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { data: minimalJobPayload } })

      await garageService.updateJob({
        jobId: 'job-1',
        description: '  Updated  ',
        status: 'completed',
        note: '  done  ',
        scheduleRepeatFor: '2024-07-01',
      })

      expect(apiClient.patch).toHaveBeenCalledWith('/garage/jobs/job-1', {
        description: 'Updated',
        status: 'completed',
        note: 'done',
        scheduleRepeatFor: '2024-07-01',
      })
    })
  })

  describe('addJobComment', () => {
    it('posts trimmed note', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          data: {
            id: 'log-1',
            actionType: 'commented',
            createdAt: '2024-01-01T00:00:00Z',
            actor: { id: 'u1', username: 'a', displayName: 'A' },
          },
        },
      })

      const log = await garageService.addJobComment({ jobId: 'job-1', note: '  hello  ' })
      expect(apiClient.post).toHaveBeenCalledWith('/garage/jobs/job-1/comments', { note: 'hello' })
      expect(log.actionType).toBe('commented')
    })
  })

  describe('addJobPart', () => {
    it('posts part with optional quantity', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalJobPayload } })

      await garageService.addJobPart({ jobId: 'job-1', repairPartId: 'rp-1', quantity: 2 })
      expect(apiClient.post).toHaveBeenCalledWith('/garage/jobs/job-1/parts', {
        repairPartId: 'rp-1',
        quantity: 2,
      })
    })
  })

  describe('removeJobPart', () => {
    it('deletes part line and returns updated job', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { data: minimalJobPayload } })
      const job = await garageService.removeJobPart('job-1', 'line-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/garage/jobs/job-1/parts/line-1')
      expect(job.id).toBe('job-1')
    })
  })

  describe('createJob', () => {
    it('posts trimmed create payload with optional ids', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { data: minimalJobPayload } })

      await garageService.createJob({
        busNumber: '  BUS-01  ',
        odometerReading: 5000,
        repairCategoryId: 'cat-1',
        priority: 'high',
        description: '  Issue  ',
        reportedDriverId: '  d1  ',
        assignedToOfficeStaffId: '  s1  ',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/garage/jobs', {
        busNumber: 'BUS-01',
        odometerReading: 5000,
        repairCategoryId: 'cat-1',
        priority: 'high',
        description: 'Issue',
        reportedDriverId: 'd1',
        assignedToOfficeStaffId: 's1',
      })
    })
  })

  describe('deleteJob', () => {
    it('calls delete endpoint', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({})
      await garageService.deleteJob('job-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/garage/jobs/job-1')
    })
  })
})
