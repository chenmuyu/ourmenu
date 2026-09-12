import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const entrySource = readFileSync(new URL('../../src/pages/entry/index.vue', import.meta.url), 'utf8')

describe('邀请页视觉与文案', () => {
  it('使用“我和你”的关系文案', () => {
    expect(entrySource).toContain('我和你')
    expect(entrySource).not.toContain('>他</')
  })

  it('不再使用复古字体和手账式装饰', () => {
    expect(entrySource).not.toContain("'Kaiti SC'")
    expect(entrySource).not.toContain('Georgia')
    expect(entrySource).not.toContain('text-shadow')
    expect(entrySource).not.toContain('border-top: 2rpx dashed')
  })
})
