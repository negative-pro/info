import type { Plugin } from 'vite'
import { ContentError, saveContent } from './content-store.ts'

export function localEditorPlugin(): Plugin {
  let pending = Promise.resolve()
  return {
    name: 'local-content-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__local/content', (request, response, next) => {
        if (request.url !== '/' && request.url !== '') return next()
        const remote = request.socket.remoteAddress
        const host = request.headers.host
        const local = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
        const origin = request.headers.origin
        const hostIsLocal = host && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
        if (!local || !hostIsLocal || !origin || origin !== `http://${host}` || request.headers['sec-fetch-site'] === 'cross-site') {
          response.writeHead(403).end(JSON.stringify({ error: 'localOnly' })); return
        }
        if (request.method !== 'POST' || !request.headers['content-type']?.startsWith('application/json')) {
          response.writeHead(405).end(JSON.stringify({ error: 'invalid' })); return
        }
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        let body = ''
        let tooLarge = false
        request.on('data', chunk => {
          if (tooLarge) return
          body += chunk.toString()
          if (Buffer.byteLength(body) > 5 * 1024 * 1024) { tooLarge = true; response.writeHead(413).end(JSON.stringify({ error: 'thumbnail' })) }
        })
        request.on('end', () => {
          if (tooLarge) return
          pending = pending.then(async () => {
            try {
              let payload: unknown
              try { payload = JSON.parse(body) } catch { throw new ContentError('invalid') }
              const result = await saveContent(server.config.root, payload)
              response.writeHead(201).end(JSON.stringify(result))
            } catch (error) {
              response.writeHead(error instanceof ContentError ? 400 : 500).end(JSON.stringify({ error: error instanceof ContentError ? error.code : 'saveFailed' }))
            }
          })
        })
      })
    },
  }
}
