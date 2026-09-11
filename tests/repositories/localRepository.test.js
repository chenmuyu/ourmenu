import { describe, expect, it } from 'vitest'
import { createLocalRepository } from '../../src/repositories/localRepository.js'

function createMemoryStorage() {
  const values = new Map()
  return {
    get(key) {
      return values.get(key)
    },
    set(key, value) {
      values.set(key, value)
    },
  }
}

describe('localRepository', () => {
  it('首次读取时返回固定两位成员和示例菜单', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })

    const kitchen = await repository.getKitchen()
    const menus = await repository.listMenus()

    expect(kitchen.members).toHaveLength(2)
    expect(menus.length).toBeGreaterThan(0)
  })

  it('可以新增菜单并重新读取', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })
    const saved = await repository.saveMenu({
      name: '清蒸鲈鱼',
      cookId: 'cook-a',
      cookedAt: '2026-09-11',
      coverUrl: '/fish.jpg',
    })

    expect(saved.id).toBeTruthy()
    expect((await repository.getMenu(saved.id)).name).toBe('清蒸鲈鱼')
  })

  it('可以更新已有菜单且不产生重复记录', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })
    const saved = await repository.saveMenu({
      name: '番茄炒蛋',
      cookId: 'cook-a',
      cookedAt: '2026-09-11',
      coverUrl: '/egg.jpg',
    })

    await repository.saveMenu({ ...saved, name: '番茄炒鸡蛋' })
    const matching = (await repository.listMenus()).filter((menu) => menu.id === saved.id)

    expect(matching).toHaveLength(1)
    expect(matching[0].name).toBe('番茄炒鸡蛋')
  })

  it('可以删除菜单', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })
    const saved = await repository.saveMenu({
      name: '红烧肉',
      cookId: 'cook-b',
      cookedAt: '2026-09-11',
      coverUrl: '/pork.jpg',
    })

    await repository.deleteMenu(saved.id)

    expect(await repository.getMenu(saved.id)).toBeNull()
  })

  it('保存厨房资料时仍然只保留两位成员', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })

    await repository.saveKitchen({
      name: '小厨房',
      members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    })

    expect((await repository.getKitchen()).members.map((member) => member.id)).toEqual(['a', 'b'])
  })
})
