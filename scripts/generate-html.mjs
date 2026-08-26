/**
 * Prerender the marketing homepage into dist/client/index.html.
 * `vite build` emits client assets + dist/server; Git/Netlify deploys
 * only publish dist/client, so without this step the live site 404s.
 */
import { pathToFileURL } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const serverPath = join(root, 'dist/server/server.js')
const clientDir = join(root, 'dist/client')
const indexPath = join(clientDir, 'index.html')

if (!existsSync(serverPath)) {
  console.error('Missing dist/server/server.js — run vite build first')
  process.exit(1)
}

const mod = await import(pathToFileURL(serverPath).href)
const entry = mod.default ?? mod

if (typeof entry?.fetch !== 'function') {
  console.error('No fetch export on server entry', Object.keys(mod))
  process.exit(1)
}

const res = await entry.fetch(
  new Request('https://glowupbeautysolutions-260.netlify.app/'),
)
const html = await res.text()
console.log('status', res.status, 'html length', html.length)

if (res.status !== 200 || !html || html.length < 100) {
  console.error('Prerender failed — not writing index.html')
  process.exit(2)
}

if (!html.includes('GlowUP')) {
  console.error('Prerender HTML missing GlowUP brand — abort')
  process.exit(2)
}

mkdirSync(clientDir, { recursive: true })
writeFileSync(indexPath, html, 'utf8')
console.log('Wrote', indexPath)
