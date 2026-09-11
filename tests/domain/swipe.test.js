import { describe, expect, it } from 'vitest'
import { clampSwipeOffset, resolveOpenedMenu } from '../../src/domain/swipe.js'

describe('resolveOpenedMenu', () => {
  it('左滑超过阈值后打开当前菜单操作区', () => {
    expect(resolveOpenedMenu({ id: 'menu-1', openedId: '', startX: 180, endX: 100 })).toBe('menu-1')
  })

  it('右滑超过阈值后关闭操作区', () => {
    expect(resolveOpenedMenu({ id: 'menu-1', openedId: 'menu-1', startX: 100, endX: 180 })).toBe('')
  })

  it('移动距离不足时保持原状态', () => {
    expect(resolveOpenedMenu({ id: 'menu-1', openedId: 'menu-2', startX: 100, endX: 80 })).toBe('menu-2')
  })
})

describe('clampSwipeOffset', () => {
  it('把拖动距离限制在删除按钮宽度内', () => {
    expect(clampSwipeOffset(-200, false, 76)).toBe(-76)
    expect(clampSwipeOffset(50, false, 76)).toBe(0)
  })

  it('已打开时允许向右拖回原位', () => {
    expect(clampSwipeOffset(40, true, 76)).toBe(-36)
    expect(clampSwipeOffset(100, true, 76)).toBe(0)
  })
})
