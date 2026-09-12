import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pagesConfig = JSON.parse(readFileSync(new URL('../../src/pages.json', import.meta.url), 'utf8'))
const homeSource = readFileSync(new URL('../../src/pages/home/index.vue', import.meta.url), 'utf8')
const wishSource = readFileSync(new URL('../../src/pages/wish-home/index.vue', import.meta.url), 'utf8')

describe('主页面标签栏', () => {
  it('使用微信原生双标签页避免整页重启', () => {
    expect(pagesConfig.tabBar.list.map((item) => item.pagePath)).toEqual([
      'pages/home/index',
      'pages/wish-home/index',
    ])
    expect(homeSource).not.toContain('<BottomNav')
    expect(wishSource).not.toContain('<BottomNav')
  })

  it('再次显示页面时保留已有内容并静默刷新', () => {
    expect(homeSource).toContain('hasLoaded')
    expect(wishSource).toContain('hasLoaded')
  })
})
