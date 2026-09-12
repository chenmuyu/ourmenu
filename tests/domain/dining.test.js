import { describe, expect, it } from 'vitest'
import {
  buildMenuSnapshot,
  countOrderDishes,
  formatShanghaiDate,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  validateDiningInvite,
  validateDiningOrder,
} from '../../src/domain/dining.js'

describe('dining invitation domain', () => {
  it('按北京时间判断邀请在就餐日结束后关闭', () => {
    expect(formatShanghaiDate(Date.UTC(2026, 8, 12, 16, 30))).toBe('2026-09-13')
    expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 15, 59))).toBe('open')
    expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 16, 0))).toBe('closed')
  })

  it('清理、去重并限制手动菜名', () => {
    expect(normalizeCustomDishNames(['  烤串  ', '烤串', '', '小龙虾', '一'.repeat(40)])).toEqual([
      '烤串',
      '小龙虾',
      '一'.repeat(30),
    ])
    expect(normalizeCustomDishNames(Array.from({ length: 20 }, (_, index) => `菜${index}`))).toHaveLength(12)
  })

  it('校验邀请主题和就餐日期', () => {
    expect(validateDiningInvite({ theme: '', diningDate: '2026-09-20' })).toEqual({
      valid: false,
      message: '请填写聚餐主题',
    })
    expect(validateDiningInvite({ theme: '周末聚餐', diningDate: '09/20/2026' })).toEqual({
      valid: false,
      message: '请选择正确的就餐日期',
    })
    expect(validateDiningInvite({ theme: '周末聚餐', diningDate: '2026-09-20' })).toEqual({ valid: true, message: '' })
  })

  it('把当前菜谱保存为包含掌勺人和缩略图的快照', () => {
    const menu = {
      id: 'menu-1',
      name: '清蒸鲈鱼',
      cookId: 'cook-a',
      groupId: 'fish',
      tagIds: ['signature'],
      coverUrl: '',
      imageUrls: ['/fish.jpg'],
    }
    const kitchen = { members: [{ id: 'cook-a', name: '我' }] }

    expect(buildMenuSnapshot(menu, kitchen)).toEqual({
      id: 'menu-1',
      name: '清蒸鲈鱼',
      cookId: 'cook-a',
      cookName: '我',
      groupId: 'fish',
      tagIds: ['signature'],
      thumbnailUrl: '/fish.jpg',
    })
  })

  it('要求至少选择或输入一道菜并统计菜品数', () => {
    expect(validateDiningOrder({ menuItems: [], customDishNames: [] })).toEqual({
      valid: false,
      message: '至少选择或输入一道菜',
    })
    const order = { menuItems: [{ id: 'menu-1' }], customDishNames: ['烤串'] }
    expect(validateDiningOrder(order)).toEqual({ valid: true, message: '' })
    expect(countOrderDishes(order)).toBe(2)
  })
})
