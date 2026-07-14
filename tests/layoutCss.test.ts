import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve('src/styles/global.css'), 'utf8')

describe('ochrana mobilního layoutu proti horizontálnímu overflow', () => {
  it('používá border-box také pro pseudo-elementy', () => {
    expect(css).toMatch(/\*,\s*\*::before,\s*\*::after\s*{\s*box-sizing:\s*border-box;/)
  })

  it('omezuje kořenové elementy na šířku viewportu a pouze horizontální overflow', () => {
    expect(css).toMatch(/html, body, #root\s*{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*min-width:\s*0;/)
    expect(css).toMatch(/html, body\s*{\s*overflow-x:\s*hidden;/)
    expect(css).not.toMatch(/html, body\s*{[^}]*overflow:\s*hidden/)
  })

  it('date input používá šířku rodiče bez 100vw', () => {
    const dateRule = css.match(/\.date-field input, \.workout-date-input, input\[type="date"\]\s*{([^}]*)}/)?.[1] ?? ''
    expect(dateRule).toContain('width: 100%')
    expect(dateRule).toContain('max-width: 100%')
    expect(dateRule).toContain('min-width: 0')
    expect(dateRule).not.toContain('100vw')
    expect(css).not.toMatch(/(?:width|min-width):\s*100vw/)
  })
})
