import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/features/audio-app/announcements.service.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function fixture({ ticketError, putError, completeError } = {}) {
  const calls = []
  const ticket = { audioId: 'audio-1', uploadUrl: 'https://r2.example.com/signed', method: 'PUT', headers: { 'Content-Type': 'audio/mpeg', 'If-None-Match': '*' }, expiresInSeconds: 300 }
  const ready = { id: 'audio-1', status: 'ready' }
  const apiClient = {
    async post(path, payload) {
      calls.push({ kind: 'api', path, payload })
      if (path.endsWith('/upload')) {
        if (ticketError) throw ticketError
        return { data: { data: ticket } }
      }
      if (completeError) throw completeError
      return { data: { data: ready } }
    },
  }
  const storage = {
    async request(config) {
      calls.push({ kind: 'put', config })
      config.onUploadProgress({ loaded: 50, total: 100 })
      config.onUploadProgress({ loaded: 100, total: 100 })
      if (putError) throw putError
    },
  }
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name === 'axios') return { create: (config) => { assert.equal(config.withCredentials, false); return storage } }
      if (name === '@/lib/api/client') return { apiClient }
      throw new Error('Unexpected dependency: ' + name)
    },
  })
  const file = { name: 'stop.mp3', size: 100, type: 'audio/mpeg' }
  return { service: exports, calls, ticket, ready, input: { file, title: 'Stop', category: 'stop_announcement' } }
}

test('uploads the raw file with signed headers, then verifies it before success', async () => {
  const { service, calls, ticket, ready, input } = fixture()
  const progress = []
  let uploadedId
  const result = await service.uploadAudio({ ...input, onProgress: n => progress.push(n), onUploaded: id => { uploadedId = id; assert.equal(calls.length, 2) } })
  assert.equal(result, ready)
  assert.equal(uploadedId, 'audio-1')
  assert.equal(calls[0].path, '/announcements/audios/upload')
  assert.equal(calls[0].payload.sizeBytes, input.file.size)
  assert.equal(calls[1].config.data, input.file)
  assert.equal(calls[1].config.headers, ticket.headers)
  assert.equal(calls[1].config.headers.Authorization, undefined)
  assert.equal(calls[2].path, '/announcements/audios/audio-1/upload-complete')
  assert.deepEqual(progress, [0, 50, 99, 100])
})

test('does not PUT or complete when upload authorization fails', async () => {
  const { service, calls, input } = fixture({ ticketError: new Error('Forbidden') })
  await assert.rejects(service.uploadAudio(input), /Forbidden/)
  assert.equal(calls.length, 1)
})

test('does not complete or mark uploaded when PUT fails', async () => {
  const { service, calls, input } = fixture({ putError: new Error('Storage error') })
  let uploaded = false
  await assert.rejects(service.uploadAudio({ ...input, onUploaded: () => { uploaded = true } }), /Audio upload failed/)
  assert.equal(calls.length, 2)
  assert.equal(uploaded, false)
})

test('preserves the uploaded id and does not report 100 percent if verification fails', async () => {
  const { service, input } = fixture({ completeError: new Error('Verification failed') })
  const progress = []
  let uploadedId
  await assert.rejects(service.uploadAudio({ ...input, onUploaded: id => { uploadedId = id }, onProgress: n => progress.push(n) }), /Verification failed/)
  assert.equal(uploadedId, 'audio-1')
  assert.equal(progress.includes(100), false)
})

test('retrying verification makes only the completion request', async () => {
  const { service, calls, ready } = fixture()
  assert.equal(await service.completeAudioUpload('audio-1'), ready)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/announcements/audios/audio-1/upload-complete')
})
