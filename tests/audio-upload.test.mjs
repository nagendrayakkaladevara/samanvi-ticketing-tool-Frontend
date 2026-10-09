import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/features/audio-app/announcements.service.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function fixture({ ticketError, putError, completeError, listError, deleteError, mappingError } = {}) {
  const calls = []
  const ticket = { audioId: 'audio-1', uploadUrl: 'https://r2.example.com/signed', method: 'PUT', headers: { 'Content-Type': 'audio/mpeg', 'If-None-Match': '*' }, expiresInSeconds: 300 }
  const ready = { id: 'audio-1', status: 'ready' }
  const apiClient = {
    async put(path, payload) {
      calls.push({ kind: 'mapping', path, payload })
      if (mappingError) throw mappingError
      return { data: { data: { id: 'default', dinnerBreakAudioId: payload.target === 'dinner_break' ? ready.id : null, toiletBreakAudioId: payload.target === 'toilet_break' ? ready.id : null } } }
    },
    async get(path, config) {
      calls.push({ kind: 'api', path, config })
      if (listError) throw listError
      return { data: { data: { items: [ready], pagination: { page: 1, total: 1, totalPages: 1 } } } }
    },
    async delete(path) {
      calls.push({ kind: 'api', path })
      if (deleteError) throw deleteError
    },
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

test('the library requests active audio using the backend default', async () => {
  const { service, calls } = fixture()
  await service.listAudios()
  assert.equal(calls[0].path, '/announcements/audios')
  assert.equal(calls[0].config.params.page, 1)
  assert.equal(calls[0].config.params.status, undefined)
})

test('recently deleted requests archived audio with server-side search and pagination', async () => {
  const { service, calls } = fixture()
  await service.listAudios({ status: 'archived', page: 2, search: 'Stop', category: 'stop_announcement' })
  assert.equal(calls[0].config.params.status, 'archived')
  assert.equal(calls[0].config.params.page, 2)
  assert.equal(calls[0].config.params.pageSize, 100)
  assert.equal(calls[0].config.params.search, 'Stop')
  assert.equal(calls[0].config.params.category, 'stop_announcement')
})

test('delete calls the soft-delete endpoint', async () => {
  const { service, calls } = fixture()
  await service.deleteAudio('audio-1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/announcements/audios/audio-1')
})

test('restore calls the explicit restore endpoint and returns the restored audio', async () => {
  const { service, calls, ready } = fixture()
  assert.equal(await service.restoreAudio('audio-1'), ready)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/announcements/audios/audio-1/restore')
})

test('delete and restore errors are preserved for the UI', async () => {
  const { service } = fixture({ deleteError: new Error('Audio is in use'), completeError: new Error('Forbidden') })
  await assert.rejects(service.deleteAudio('audio-1'), /Audio is in use/)
  await assert.rejects(service.restoreAudio('audio-1'), /Forbidden/)
})

test('recently deleted errors are preserved for the retry state', async () => {
  const { service } = fixture({ listError: new Error('Network unavailable') })
  await assert.rejects(service.listAudios({ status: 'archived' }), /Network unavailable/)
})

for (const target of ['dinner_break', 'toilet_break']) {
  test(`uploading for ${target} verifies Common audio before mapping the button`, async () => {
    const { service, input, calls, ready } = fixture()
    let verified = false
    const result = await service.uploadAudio({ ...input, category: target, onVerified: () => { verified = true; assert.equal(calls.length, 3) } })
    assert.equal(result, ready)
    assert.equal(verified, true)
    assert.equal(calls[0].payload.category, 'common_audio')
    assert.equal(calls[2].path, '/announcements/audios/audio-1/upload-complete')
    assert.equal(calls[3].path, '/announcements/audios/audio-1/break-mapping')
    assert.equal(calls[3].payload.target, target)
  })
}

test('failed verification never changes a break mapping', async () => {
  const { service, input, calls } = fixture({ completeError: new Error('Not verified') })
  await assert.rejects(service.uploadAudio({ ...input, category: 'toilet_break' }), /Not verified/)
  assert.equal(calls.some(call => call.kind === 'mapping'), false)
})

test('mapping failure retains the uploaded id and ready state for retry without re-upload', async () => {
  const { service, input, calls } = fixture({ mappingError: new Error('Forbidden') })
  let uploadedId
  let verified = false
  const progress = []
  await assert.rejects(service.uploadAudio({ ...input, category: 'toilet_break', onUploaded: id => { uploadedId = id }, onVerified: () => { verified = true }, onProgress: value => progress.push(value) }), /Forbidden/)
  assert.equal(uploadedId, 'audio-1')
  assert.equal(verified, true)
  assert.equal(progress.includes(100), false)
  assert.equal(calls.filter(call => call.kind === 'put').length, 1)
  const retry = fixture()
  await retry.service.completeAudioUpload(uploadedId, { breakTarget: 'toilet_break' })
  assert.equal(retry.calls.length, 2)
  assert.equal(retry.calls[0].path, '/announcements/audios/audio-1/upload-complete')
  assert.equal(retry.calls[1].payload.target, 'toilet_break')
})

test('existing Common audio can be mapped without a new upload', async () => {
  const { service, calls } = fixture()
  await service.mapAudioToBreak('audio-1', 'dinner_break')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/announcements/audios/audio-1/break-mapping')
  assert.equal(calls[0].payload.target, 'dinner_break')
})

test('ordinary Common audio does not get assigned automatically', async () => {
  const { service, input, calls } = fixture()
  await service.uploadAudio({ ...input, category: 'common_audio' })
  assert.equal(calls[0].payload.category, 'common_audio')
  assert.equal(calls.some(call => call.kind === 'mapping'), false)
})

// Exercise the upload dialog's actual effect without needing a browser DOM.
const pageSource = readFileSync(new URL('../src/pages/AudioAppPage.tsx', import.meta.url), 'utf8')
const pageAst = ts.createSourceFile('AudioAppPage.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const uploadDialog = pageAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'AudioUploadDialog')
const scrollEffect = uploadDialog.body.statements.find(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText(pageAst) === 'useEffect')
const scrollEffectCode = ts.transpileModule(scrollEffect.getText(pageAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText

function scrollFixture({ pending = true, reducedMotion = false } = {}) {
  let frame
  let cleanup
  let dependencies
  const scrolled = []
  const cancelled = []
  const progressRef = { current: null }
  vm.runInNewContext(scrollEffectCode, {
    mutation: { isPending: pending }, reducedMotion, progressRef,
    useEffect(effect, deps) { dependencies = Array.from(deps); cleanup = effect() },
    window: {
      requestAnimationFrame(callback) { frame = callback; return 42 },
      cancelAnimationFrame(id) { cancelled.push(id); frame = undefined },
    },
  })
  // The panel mounts before the scheduled animation frame runs.
  progressRef.current = { scrollIntoView(options) { scrolled.push({ ...options }) } }
  return { flush: () => frame?.(), cleanup: () => cleanup?.(), scrolled, cancelled, dependencies }
}

test('upload and verification retry reveal the mounted progress panel smoothly', () => {
  const fixture = scrollFixture()
  assert.equal(fixture.scrolled.length, 0)
  fixture.flush()
  assert.deepEqual(fixture.scrolled, [{ behavior: 'smooth', block: 'center', inline: 'nearest' }])
  assert.deepEqual(fixture.dependencies, [true, false])
})

test('upload progress scrolling respects reduced motion', () => {
  const fixture = scrollFixture({ reducedMotion: true })
  fixture.flush()
  assert.equal(fixture.scrolled[0].behavior, 'auto')
})

test('idle upload dialogs do not scroll, and pending frames are cancelled on cleanup', () => {
  const idle = scrollFixture({ pending: false })
  idle.flush()
  assert.equal(idle.scrolled.length, 0)
  const pending = scrollFixture()
  pending.cleanup()
  pending.flush()
  assert.deepEqual(pending.cancelled, [42])
  assert.equal(pending.scrolled.length, 0)
})
