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
  it('本地体验模式以家庭成员身份进入', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })

    expect(await repository.getAccessState()).toEqual({ role: 'family', memberId: 'cook-a' })
    expect(await repository.bindFamily('0928')).toEqual({ role: 'family', memberId: 'cook-a' })
  })

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

  it('保存并重新读取共用底图、食材分组和菜品标签', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })
    const kitchen = await repository.getKitchen()

    await repository.saveKitchen({
      ...kitchen,
      backgroundUrl: '/loving-background.jpg',
      groups: [{ id: 'custom', name: '烧烤', active: true, order: 0 }],
      tags: [{ id: 'anniversary', name: '纪念日', active: true, order: 0 }],
    })

    expect(await repository.getKitchen()).toMatchObject({
      backgroundUrl: '/loving-background.jpg',
      groups: [{ id: 'custom', name: '烧烤', active: true, order: 0 }],
      tags: [{ id: 'anniversary', name: '纪念日', active: true, order: 0 }],
    })
  })

  it('可以新增、更新和删除想吃记录', async () => {
    const repository = createLocalRepository({ storage: createMemoryStorage() })
    const saved = await repository.saveWish({ name: '生椰拿铁', status: 'want' })

    expect((await repository.getWish(saved.id)).name).toBe('生椰拿铁')

    await repository.saveWish({ ...saved, status: 'again' })
    expect((await repository.listWishes()).find((item) => item.id === saved.id)?.status).toBe('again')

    await repository.deleteWish(saved.id)
    expect(await repository.getWish(saved.id)).toBeNull()
  })
})
