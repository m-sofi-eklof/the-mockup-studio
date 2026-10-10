import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const SETTINGS_DIR = path.resolve(import.meta.dirname, 'saved-settings')

// Persists each page's mockup settings to saved-settings/<key>.json so they live in real files,
// not just browser localStorage.
function settingsApi(): Plugin {
  return {
    name: 'settings-api',
    configureServer(server) {
      server.middlewares.use('/api/settings/', (req, res) => {
        const key = decodeURIComponent((req.url ?? '').replace(/^\//, '').split('?')[0])
        if (!/^[\w.-]+$/.test(key)) {
          res.statusCode = 400
          return res.end('bad key')
        }
        const file = path.join(SETTINGS_DIR, `${key}.json`)
        if (req.method === 'GET') {
          if (!fs.existsSync(file)) {
            res.statusCode = 404
            return res.end()
          }
          res.setHeader('Content-Type', 'application/json')
          return res.end(fs.readFileSync(file, 'utf8'))
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              JSON.parse(body)
              fs.mkdirSync(SETTINGS_DIR, { recursive: true })
              fs.writeFileSync(file, body)
              res.statusCode = 204
            } catch {
              res.statusCode = 400
            }
            res.end()
          })
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), settingsApi()],
  server: {
    port: 5317,
    strictPort: true,
    open: true,
    watch: { ignored: ['**/saved-settings/**', '**/backups/**'] },
  },
})
