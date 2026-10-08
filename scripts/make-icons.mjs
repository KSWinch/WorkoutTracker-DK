// Renders the PNG app icons in /public from scripts/icon-source.png (square, ideally 1024px) using headless
// Chrome (or Edge). The maskable icon is shrunk onto black so Android's round crop doesn't clip the helmet.
// Run: node scripts/make-icons.mjs   — set CHROME=/path/to/chrome if it isn't found automatically.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]
const chrome = candidates.find((p) => p && existsSync(p))
if (!chrome) throw new Error('Chrome/Edge not found; set CHROME to its path.')

const source = fileURLToPath(new URL('./icon-source.png', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'icons-'))

try {
  const icons = [
    ['icon-192.png', 192, 1],
    ['icon-512.png', 512, 1],
    ['icon-maskable-512.png', 512, 0.84],
    ['apple-touch-icon.png', 180, 1],
    ['favicon-32.png', 32, 1],
  ]
  for (const [file, size, scale] of icons) {
    const page = join(dir, `${file}.html`)
    const px = Math.round(size * scale)
    const pad = (size - px) / 2
    // A shrunk image's own background isn't pure black, so fade its edges out to avoid a visible square.
    const fade = 'transparent, #000 10%, #000 90%, transparent'
    const mask = scale < 1 ? `mask-image:linear-gradient(to right,${fade}),linear-gradient(${fade});mask-composite:intersect;` : ''
    writeFileSync(
      page,
      `<style>html,body{margin:0;background:#000}img{display:block;width:${px}px;height:${px}px;margin:${pad}px;${mask}}</style>` +
        `<img src="${pathToFileURL(source)}">`,
    )
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${size},${size}`,
      `--screenshot=${fileURLToPath(new URL(`../public/${file}`, import.meta.url))}`,
      pathToFileURL(page).href,
    ], { stdio: 'ignore' })
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
