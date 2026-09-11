import { describe, expect, it } from 'vitest'
import { createHomeSharePayload } from '../../src/domain/share.js'

describe('createHomeSharePayload', () => {
  it('使用菜单册名称生成首页转发信息', () => {
    expect(createHomeSharePayload('我们的菜单')).toEqual({
      title: '邀请你看看我们的菜单',
      path: '/pages/home/index',
    })
  })

  it('菜单册名称为空时使用默认名称', () => {
    expect(createHomeSharePayload('')).toEqual({
      title: '邀请你看看两人菜单',
      path: '/pages/home/index',
    })
  })
})
