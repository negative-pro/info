// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { localEditorPlugin } from './local-editor-plugin.ts'

let server: ViteDevServer
let root: string
let origin: string
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'negative-editor-http-'))
  await mkdir(join(root, 'src/content/ar'), { recursive: true })
  await writeFile(join(root, 'src/content/ar/arabic-movies.json'), JSON.stringify({ category: { id: 'arabic', slug: 'arabic', name: 'Arabic', description: '', order: 1 }, items: [] }))
  server = await createServer({ root, configFile: false, plugins: [localEditorPlugin()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' })
  await server.listen()
  const address = server.httpServer!.address()
  if (!address || typeof address === 'string') throw new Error('No local port')
  origin = `http://127.0.0.1:${address.port}`
})
afterAll(async () => { await server?.close(); if (root) await rm(root, { recursive: true, force: true }) })
it('rejects cross-origin requests and serializes same-origin JSON saves', async () => {
  const payload = (id: string) => ({ categoryId: 'arabic', item: { id, work: null, kind: 'post', platform: 'website', title: 'A post', description: '', body: [], externalUrl: null, videoLayout: 'landscape', thumbnailAsset: null, publishedAt: null } })
  const send = (id: string, requestOrigin: string) => fetch(`${origin}/__local/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin }, body: JSON.stringify(payload(id)) })
  expect((await send('blocked-post', 'https://example.com')).status).toBe(403)
  const responses = await Promise.all([send('first-post', origin), send('second-post', origin)])
  expect(responses.map(response => response.status)).toEqual([201, 201])
  const content = JSON.parse(await readFile(join(root, 'src/content/ar/arabic-movies.json'), 'utf8'))
  expect(content.items.map((post: { id: string }) => post.id).sort()).toEqual(['first-post', 'second-post'])
  expect((await send('first-post', origin)).status).toBe(400)
})
