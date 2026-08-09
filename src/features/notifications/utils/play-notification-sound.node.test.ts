// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { playNotificationSound } from './play-notification-sound'

describe('play-notification-sound (node)', () => {
  it('returns immediately when window is undefined', async () => {
    await expect(playNotificationSound()).resolves.toBeUndefined()
  })
})
