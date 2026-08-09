import { describe, expect, it } from 'vitest'

import { makeRepairCategoryNode } from '@/test/fixtures/garage'
import {
  canAddChildCategory,
  countRepairCategoryNodes,
  findRepairCategoryById,
  flattenRepairCategoryOptions,
  formatRepairCategoryUpdatedAt,
  validateRepairCategoryName,
} from './repair-category-model'

describe('formatRepairCategoryUpdatedAt', () => {
  it('returns em dash for empty or invalid dates', () => {
    expect(formatRepairCategoryUpdatedAt(undefined)).toBe('—')
    expect(formatRepairCategoryUpdatedAt('invalid')).toBe('—')
  })

  it('formats valid dates', () => {
    expect(formatRepairCategoryUpdatedAt('2024-06-01T10:00:00Z')).toMatch(/2024/)
  })
})

describe('flattenRepairCategoryOptions', () => {
  it('flattens tree with path labels and skips level 5 nodes', () => {
    const tree = [
      makeRepairCategoryNode({
        id: 'root',
        name: 'Root',
        level: 1,
        children: [
          makeRepairCategoryNode({
            id: 'child',
            name: 'Child',
            level: 2,
            parentId: 'root',
            children: [],
          }),
          makeRepairCategoryNode({
            id: 'leaf5',
            name: 'Level5',
            level: 5,
            parentId: 'root',
            children: [],
          }),
        ],
      }),
    ]

    const options = flattenRepairCategoryOptions(tree)
    expect(options).toEqual([
      { id: 'root', label: 'Root', level: 1 },
      { id: 'child', label: 'Root › Child', level: 2 },
    ])
  })

  it('returns empty array for empty tree', () => {
    expect(flattenRepairCategoryOptions([])).toEqual([])
  })
})

describe('countRepairCategoryNodes', () => {
  it('counts all nodes including nested children', () => {
    const tree = [
      makeRepairCategoryNode({
        children: [makeRepairCategoryNode({ id: 'c1', children: [] })],
      }),
    ]
    expect(countRepairCategoryNodes(tree)).toBe(2)
    expect(countRepairCategoryNodes([])).toBe(0)
  })
})

describe('findRepairCategoryById', () => {
  const tree = [
    makeRepairCategoryNode({
      id: 'root',
      children: [makeRepairCategoryNode({ id: 'nested', children: [] })],
    }),
  ]

  it('finds node at any depth', () => {
    expect(findRepairCategoryById(tree, 'nested')?.id).toBe('nested')
  })

  it('returns null when not found', () => {
    expect(findRepairCategoryById(tree, 'missing')).toBeNull()
    expect(findRepairCategoryById([], 'root')).toBeNull()
  })
})

describe('validateRepairCategoryName', () => {
  it('requires non-empty trimmed name', () => {
    expect(validateRepairCategoryName('')).toBe('Category name is required.')
    expect(validateRepairCategoryName('   ')).toBe('Category name is required.')
  })

  it('rejects names over 120 characters', () => {
    expect(validateRepairCategoryName('a'.repeat(121))).toBe(
      'Category name must be 120 characters or fewer.',
    )
  })

  it('accepts valid names', () => {
    expect(validateRepairCategoryName('Brakes')).toBeNull()
    expect(validateRepairCategoryName('a'.repeat(120))).toBeNull()
  })
})

describe('canAddChildCategory', () => {
  it('allows children when level is below 5', () => {
    expect(canAddChildCategory({ level: 1 })).toBe(true)
    expect(canAddChildCategory({ level: 4 })).toBe(true)
    expect(canAddChildCategory({ level: 5 })).toBe(false)
  })
})
