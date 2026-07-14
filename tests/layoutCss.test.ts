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
    expect(css).toMatch(/html, body\s*{\s*overflow-x:\s*clip;/)
    expect(css).toMatch(/@supports not \(overflow:\s*clip\)\s*{\s*html, body\s*{\s*overflow-x:\s*hidden;/)
    expect(css).not.toMatch(/html, body\s*{[^}]*overflow:\s*hidden/)
  })

  it('společný wrapper určuje geometrii celého obsahu tréninku', () => {
    const contentRule = css.match(/\.workout-screen__content\s*{([^}]*)}/)?.[1] ?? ''
    expect(contentRule).toContain('width: 100%')
    expect(contentRule).toContain('max-width: 100%')
    expect(contentRule).toContain('min-width: 0')
    expect(contentRule).toContain('flex-direction: column')
    expect(contentRule).toContain('padding-inline: 0')
  })

  it('date sekce a seznam cviků používají shodnou geometrii bez vlastního paddingu', () => {
    const blocksRule = css.match(/\.workout-date-section, \.workout-exercises\s*{([^}]*)}/)?.[1] ?? ''
    expect(blocksRule).toContain('width: 100%')
    expect(blocksRule).toContain('max-width: 100%')
    expect(blocksRule).toContain('min-width: 0')
    expect(blocksRule).toContain('margin-inline: 0')
    expect(blocksRule).toContain('padding-inline: 0')
  })

it('date input používá šířku rodiče a cílený iOS Safari workaround', () => {
  const dateRule =
    css.match(
      /\.workout-date-input(?:\[type=["']date["']\])?\s*{([^}]*)}/,
    )?.[1] ?? ''

  expect(dateRule).toContain('width: 100%')
  expect(dateRule).toContain('max-width: 100%')
  expect(dateRule).toContain('min-width: 0')
  expect(dateRule).toContain('margin: 0')
  expect(dateRule).toContain('box-sizing: border-box')

  expect(dateRule).toContain('-webkit-min-logical-width: 0')
  expect(dateRule).toContain('-webkit-appearance: none')
  expect(dateRule).toContain('appearance: none')

  expect(dateRule).not.toContain('100vw')
  expect(css).not.toMatch(/(?:width|min-width):\s*100vw/)
})
})
