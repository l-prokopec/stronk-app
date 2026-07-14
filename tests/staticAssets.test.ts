import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootFile = (path: string) => resolve(path)
const pngSize = (path: string): [number, number] => {
  const bytes = readFileSync(rootFile(path))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return [view.getUint32(16), view.getUint32(20)]
}

describe('metadata a ikony Stronk App', () => {
  const html = readFileSync(rootFile('index.html'), 'utf8')
  const manifest = JSON.parse(readFileSync(rootFile('public/site.webmanifest'), 'utf8')) as { name: string; short_name: string; start_url: string; icons: Array<{ src: string }> }

  it('používá název v title a Apple metadatech', () => { expect(html).toContain('<title>Stronk App</title>'); expect(html).toContain('name="apple-mobile-web-app-title" content="Stronk App"') })
  it('odkazuje relativně na favicon, Apple ikonu a manifest', () => { expect(html).toContain('%BASE_URL%favicon.svg'); expect(html).toContain('%BASE_URL%favicon-32x32.png'); expect(html).toContain('%BASE_URL%icons/apple-touch-icon.png'); expect(html).toContain('%BASE_URL%site.webmanifest'); expect(html).not.toContain('vite.svg') })
  it('manifest obsahuje správný název a relativní cesty', () => { expect(manifest.name).toBe('Stronk App'); expect(manifest.short_name).toBe('Stronk'); expect(manifest.start_url).toBe('./'); expect(manifest.icons.every((icon) => !icon.src.startsWith('/'))).toBe(true) })
  it('všechny odkazované assety existují', () => { ['public/favicon.svg', 'public/favicon-32x32.png', 'public/icons/apple-touch-icon.png', ...manifest.icons.map((icon) => `public/${icon.src}`)].forEach((path) => expect(existsSync(rootFile(path)), path).toBe(true)) })
  it('PNG ikony mají požadované rozměry', () => { expect(pngSize('public/favicon-32x32.png')).toEqual([32, 32]); expect(pngSize('public/icons/apple-touch-icon.png')).toEqual([180, 180]); expect(pngSize('public/icons/icon-192.png')).toEqual([192, 192]); expect(pngSize('public/icons/icon-512.png')).toEqual([512, 512]); expect(pngSize('public/icons/icon-512-maskable.png')).toEqual([512, 512]) })
})
