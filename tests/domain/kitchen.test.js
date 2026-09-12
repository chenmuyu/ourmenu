import { describe, expect, it } from 'vitest'
import { DEFAULT_GROUPS, DEFAULT_TAGS, normalizeKitchen } from '../../src/domain/kitchen.js'

describe('normalizeKitchen', () => {
  it('固定保留两名成员并使用粤湘情作为默认名称', () => {
    const kitchen = normalizeKitchen({ members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] })

    expect(kitchen.name).toBe('粤湘情')
    expect(kitchen.members.map((member) => member.id)).toEqual(['a', 'b'])
  })

  it('补齐默认食材分组和四个默认标签', () => {
    const kitchen = normalizeKitchen({})

    expect(kitchen.groups.map((item) => item.name)).toEqual(DEFAULT_GROUPS.map((item) => item.name))
    expect(kitchen.tags.map((item) => item.name)).toEqual(['荤菜', '素菜', '超级拿手菜', '汤汤水水'])
    expect(kitchen.tags).toHaveLength(DEFAULT_TAGS.length)
  })

  it('保留自定义项目并规范化停用状态和排序', () => {
    const kitchen = normalizeKitchen({
      groups: [{ id: 'custom', name: '海鲜大餐', active: false, order: 9 }],
      tags: [{ id: 'favorite', name: '纪念日', active: true, order: 8 }],
    })

    expect(kitchen.groups).toEqual([{ id: 'custom', name: '海鲜大餐', active: false, order: 9 }])
    expect(kitchen.tags).toEqual([{ id: 'favorite', name: '纪念日', active: true, order: 8 }])
  })
})
