import { describe, expect, it, vi } from 'vitest'

import { base64ToDataUrl, fileToBase64 } from './file-to-base64'

function makeFile(content: string, type = 'text/plain'): File {
  return new File([content], 'test.txt', { type })
}

describe('fileToBase64', () => {
  it('resolves base64 payload from file', async () => {
    const file = makeFile('hello')
    const result = await fileToBase64(file)
    expect(result).toBe(btoa('hello'))
  })

  it('rejects when FileReader result is not a string', async () => {
    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result: ArrayBuffer | null = new ArrayBuffer(8)

      readAsDataURL() {
        this.onload?.()
      }
    }
    vi.stubGlobal('FileReader', MockFileReader)

    await expect(fileToBase64(makeFile('x'))).rejects.toThrow('Unable to read the selected file.')

    vi.stubGlobal('FileReader', originalFileReader)
  })

  it('rejects when data URL has no base64 segment', async () => {
    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      result = 'data:text/plain;base64,'

      readAsDataURL() {
        this.onload?.()
      }
    }
    vi.stubGlobal('FileReader', MockFileReader)

    await expect(fileToBase64(makeFile('x'))).rejects.toThrow('Unable to encode the selected file.')

    vi.stubGlobal('FileReader', originalFileReader)
  })

  it('rejects on FileReader error', async () => {
    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      readAsDataURL() {
        this.onerror?.()
      }
    }
    vi.stubGlobal('FileReader', MockFileReader)

    await expect(fileToBase64(makeFile('x'))).rejects.toThrow('Unable to read the selected file.')

    vi.stubGlobal('FileReader', originalFileReader)
  })
})

describe('base64ToDataUrl', () => {
  it('returns data URL unchanged when already prefixed', () => {
    const dataUrl = 'data:image/png;base64,abc'
    expect(base64ToDataUrl(dataUrl)).toBe(dataUrl)
  })

  it('wraps raw base64 with default mime type', () => {
    expect(base64ToDataUrl('abc')).toBe('data:image/jpeg;base64,abc')
  })

  it('wraps raw base64 with custom mime type', () => {
    expect(base64ToDataUrl('abc', 'image/png')).toBe('data:image/png;base64,abc')
  })
})
