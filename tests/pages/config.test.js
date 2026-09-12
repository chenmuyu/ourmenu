import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pages = JSON.parse(readFileSync(new URL('../../src/pages.json', import.meta.url), 'utf8')).pages

describe('页面配置', () => {
  it('不向微信页面配置输出无效的分享字段', () => {
    expect(pages.every((page) => page.style?.enableShareAppMessage === undefined)).toBe(true)
  })
})
