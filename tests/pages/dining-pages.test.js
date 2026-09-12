import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pagesConfig = JSON.parse(readFileSync(new URL('../../src/pages.json', import.meta.url), 'utf8'))
const homeSource = readFileSync(new URL('../../src/pages/home/index.vue', import.meta.url), 'utf8')

describe('点菜邀请页面', () => {
  it('注册四个独立页面且不增加底部标签', () => {
    const pagePaths = pagesConfig.pages.map((page) => page.path)
    expect(pagePaths).toEqual(
      expect.arrayContaining([
        'pages/dining-create/index',
        'pages/dining-order/index',
        'pages/dining-records/index',
        'pages/dining-manage/index',
      ]),
    )
    expect(pagesConfig.tabBar.list).toHaveLength(2)
    ;['dining-create', 'dining-order', 'dining-records', 'dining-manage'].forEach((name) => {
      expect(existsSync(new URL(`../../src/pages/${name}/index.vue`, import.meta.url))).toBe(true)
    })
  })

  it('主人首页提供创建邀请和点菜记录入口', () => {
    expect(homeSource).toContain('欢迎点菜')
    expect(homeSource).toContain('点菜记录')
    expect(homeSource).toContain("uni.navigateTo({ url: '/pages/dining-create/index' })")
    expect(homeSource).toContain("uni.navigateTo({ url: '/pages/dining-records/index' })")
    expect(homeSource).toContain('v-if="isFamily"')
  })
})
