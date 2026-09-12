import { describe, expect, it } from 'vitest'
import { getMenuThumbnail, getMenusByCook, validateMenu } from '../../src/domain/menu.js'

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

  it('公共食材分组会同时过滤当前掌勺人的菜单', () => {
    const menus = [
      { id: '1', cookId: 'cook-a', groupId: 'beef' },
      { id: '2', cookId: 'cook-a', groupId: 'fish' },
      { id: '3', cookId: 'cook-b', groupId: 'beef' },
    ]

    expect(getMenusByCook(menus, 'cook-a', 'beef').map((menu) => menu.id)).toEqual(['1'])
    expect(getMenusByCook(menus, 'cook-b', 'beef').map((menu) => menu.id)).toEqual(['3'])
  })
})

describe('getMenuThumbnail', () => {
  it('使用封面图作为列表缩略图', () => {
    expect(getMenuThumbnail({ coverUrl: ' cloud://dish.jpg ' })).toBe('cloud://dish.jpg')
  })

  it('封面不存在时返回空地址', () => {
    expect(getMenuThumbnail({})).toBe('')
  })

  it('没有封面时使用第一张详情图', () => {
    expect(getMenuThumbnail({ imageUrls: [' cloud://detail.jpg ', 'cloud://second.jpg'] })).toBe(
      'cloud://detail.jpg',
    )
  })
})

describe('validateMenu', () => {
  const members = [{ id: 'cook-a' }, { id: 'cook-b' }]

  it.each([
    [{ cookId: 'cook-a' }, '请填写菜名'],
    [{ name: '番茄炒蛋' }, '请选择掌勺人'],
    [{ name: '番茄炒蛋', cookId: 'cook-c' }, '掌勺人不属于当前厨房'],
  ])('拒绝无效菜单 %#', (menu, message) => {
    expect(validateMenu(menu, members)).toEqual({ valid: false, message })
  })

  it('图片为空时仍接受菜名和掌勺人有效的菜单', () => {
    expect(validateMenu({ name: ' 番茄炒蛋 ', cookId: 'cook-a' }, members)).toEqual({
      valid: true,
      message: '',
    })
  })
})
