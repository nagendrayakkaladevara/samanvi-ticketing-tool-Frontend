import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { makeRepairJob } from '@/test/fixtures/garage'

import { JobDetailsHeader } from './job-details-header'

describe('JobDetailsHeader', () => {
  it('renders job summary and action buttons', async () => {
    const user = userEvent.setup()
    const onUpdateStatus = vi.fn()

    render(
      <JobDetailsHeader
        job={makeRepairJob({ jobIdNumber: 'RJ-200' })}
        canViewJob
        canEditJob
        canAddParts
        isRepeatEditMode={false}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        onAddPart={vi.fn()}
        onScheduleRepeat={vi.fn()}
        onDownload={vi.fn()}
        onHistory={vi.fn()}
        onToggleComment={vi.fn()}
        onUpdateStatus={onUpdateStatus}
      />,
    )

    expect(screen.getByText('RJ-200')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Update status/i }))
    expect(onUpdateStatus).toHaveBeenCalled()
  })
})
