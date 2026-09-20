import { describe, expect, it } from 'vitest'
import stylesheet from './global.css?raw'

const ruleBody = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return stylesheet.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('pastelový světlý a tmavý motiv', () => {
  it('centralizuje pastelové povrchy a samostatné akcenty osob', () => {
    expect(stylesheet).toMatch(/--background:\s*#f7f5ff/)
    expect(stylesheet).toMatch(/--surface-card:\s*#[0-9a-f]{6}/i)
    expect(stylesheet).toMatch(/--surface-input:\s*#[0-9a-f]{6}/i)
    expect(stylesheet).toMatch(/--lukas-accent:\s*#[0-9a-f]{6}/i)
    expect(stylesheet).toMatch(/--terka-accent:\s*#[0-9a-f]{6}/i)
  })

  it('obsahuje kompletní tmavou paletu', () => {
    const darkTheme = ruleBody(':root[data-theme="dark"]')
    expect(darkTheme).toMatch(/color-scheme:\s*dark/)
    expect(darkTheme).toMatch(/--background:\s*#[0-9a-f]{6}/i)
    expect(darkTheme).toMatch(/--surface-card:\s*#[0-9a-f]{6}/i)
    expect(darkTheme).toMatch(/--text-primary:\s*#[0-9a-f]{6}/i)
  })

  it('nepoužívá velké barevné pozadí sekcí osob', () => {
    expect(ruleBody('.person-sets--lukas .person-sets__heading')).not.toMatch(/background/i)
    expect(ruleBody('.person-sets--terka .person-sets__heading')).not.toMatch(/background/i)
    expect(ruleBody('.person-sets')).not.toMatch(/background/i)
  })

  it('ponechává řádky bez rámečku karty a přidávací akci bez výplně', () => {
    expect(ruleBody('.person-set-row')).not.toMatch(/border(?:-radius)?:/i)
    expect(ruleBody('.add-person-set')).toMatch(/background:\s*transparent/i)
    expect(ruleBody('.add-person-set')).toMatch(/width:\s*auto/i)
  })
})
