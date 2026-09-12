import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const homeSource = readFileSync(new URL('../../src/pages/home/index.vue', import.meta.url), 'utf8')
const wishSource = readFileSync(new URL('../../src/pages/wish-home/index.vue', import.meta.url), 'utf8')
const settingsSource = readFileSync(new URL('../../src/pages/settings/index.vue', import.meta.url), 'utf8')
const cloudSource = readFileSync(new URL('../../cloudfunctions/two-person-menu-api/index.js', import.meta.url), 'utf8')

describe('菜谱顶图', () => {
  it('只在菜谱页顶部作为不占位的半透明背景展示', () => {
    expect(homeSource).toContain('kitchen.menuHeroUrl')
    expect(homeSource).toContain('class="menu-hero-background"')
    expect(homeSource).toContain('class="menu-hero-wash"')
    expect(homeSource).toMatch(/\.menu-hero-background[\s\S]*?position:\s*absolute;/)
    expect(homeSource).toMatch(/\.menu-hero-background[\s\S]*?opacity:\s*0\.46;/)
    expect(homeSource).not.toContain('class="menu-hero-image"')
    expect(homeSource).not.toContain('class="page-background"')
    expect(wishSource).not.toContain('kitchen.backgroundUrl')
    expect(wishSource).not.toContain('kitchen.menuHeroUrl')
  })

  it('设置页改为菜谱顶图配置', () => {
    expect(settingsSource).toContain('菜谱顶图')
    expect(settingsSource).toContain('半透明氛围图，不占页面位置')
    expect(settingsSource).toContain('kitchen.value.menuHeroUrl')
    expect(settingsSource).not.toContain('两个主页面共用一张底图')
  })

  it('云端公开并保存专用顶图字段', () => {
    expect(cloudSource).toContain("menuHeroUrl: kitchen.menuHeroUrl || kitchen.backgroundUrl || ''")
    expect(cloudSource).toContain("menuHeroUrl: String(input.menuHeroUrl || '').trim()")
  })
})
