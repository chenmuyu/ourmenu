import { describe, expect, it } from 'vitest'
import { getMenusByCook, normalizeKitchen, validateMenu } from '../../src/domain/menu.js'

describe('getMenusByCook', () => {
  it('只返回指定掌勺人的菜单，并按日期和创建时间倒序排列', () => {
    const menus = [
      { id: '1', cookId: 'cook-a', cookedAt: '2026-09-10', createdAt: 1 },
      { id: '2', cookId: 'cook-b', cookedAt: '2026-09-11', createdAt: 2 },
      { id: '3', cookId: 'cook-a', cookedAt: '2026-09-11', createdAt: 3 },
      { id: '4', cookId: 'cook-a', cookedAt: '2026-09-11', createdAt: 4 },
    ]

    expect(getMenusByCook(menus, 'cook-a').map((menu) => menu.id)).toEqual(['4', '3', '1'])
  })

  it('缺少菜单数据时返回空数组', () => {
    expect(getMenusByCook(undefined, 'cook-a')).toEqual([])
  })
})

describe('validateMenu', () => {
  const members = [{ id: 'cook-a' }, { id: 'cook-b' }]

  it.each([
    [{ cookId: 'cook-a', coverUrl: '/cover.jpg' }, '请填写菜名'],
    [{ name: '番茄炒蛋', coverUrl: '/cover.jpg' }, '请选择掌勺人'],
    [{ name: '番茄炒蛋', cookId: 'cook-a' }, '请上传封面图'],
    [{ name: '番茄炒蛋', cookId: 'cook-c', coverUrl: '/cover.jpg' }, '掌勺人不属于当前厨房'],
  ])('拒绝无效菜单 %#', (menu, message) => {
    expect(validateMenu(menu, members)).toEqual({ valid: false, message })
  })

  it('接受信息完整且掌勺人属于厨房的菜单', () => {
    expect(validateMenu({ name: ' 番茄炒蛋 ', cookId: 'cook-a', coverUrl: '/cover.jpg' }, members)).toEqual({
      valid: true,
      message: '',
    })
  })
})

describe('normalizeKitchen', () => {
  it('固定保留两名成员', () => {
    const kitchen = normalizeKitchen({
      name: '我们的厨房',
      members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    })

    expect(kitchen.members.map((member) => member.id)).toEqual(['a', 'b'])
  })

  it('缺少成员时补齐默认成员', () => {
    const kitchen = normalizeKitchen({ members: [{ id: 'a', name: '小明' }] })

    expect(kitchen.members).toHaveLength(2)
    expect(kitchen.members[1]).toMatchObject({ id: 'cook-b', name: '第二位' })
  })
})
