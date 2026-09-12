import { normalizeKitchen } from '../domain/kitchen.js'
import { sortWishes } from '../domain/wish.js'

const KITCHEN_KEY = 'two-person-menu:kitchen'
const MENUS_KEY = 'two-person-menu:menus'
const WISHES_KEY = 'two-person-menu:wishes'

const defaultKitchen = normalizeKitchen({
  members: [
    { id: 'cook-a', name: '我', avatarUrl: '', bound: true },
    { id: 'cook-b', name: '老公', avatarUrl: '', bound: true },
  ],
})

const defaultMenus = [
  {
    id: 'sample-1',
    name: '番茄炒蛋',
    cookId: 'cook-a',
    cookedAt: '2026-09-11',
    coverUrl: '/static/images/sample-tomato.svg',
    imageUrls: [],
    note: '鸡蛋炒嫩一点，最后再放盐。',
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: 'sample-2',
    name: '清炒时蔬',
    cookId: 'cook-a',
    cookedAt: '2026-09-09',
    coverUrl: '/static/images/sample-greens.svg',
    imageUrls: [],
    note: '',
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: 'sample-3',
    name: '葱油拌面',
    cookId: 'cook-b',
    cookedAt: '2026-09-10',
    coverUrl: '/static/images/sample-noodles.svg',
    imageUrls: [],
    note: '葱油可以一次多熬一些。',
    createdAt: 1,
    updatedAt: 1,
  },
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createUniStorage() {
  return {
    get(key) {
      return uni.getStorageSync(key)
    },
    set(key, value) {
      uni.setStorageSync(key, value)
    },
  }
}

export function createLocalRepository({ storage = createUniStorage() } = {}) {
  function getStoredKitchen() {
    return normalizeKitchen(storage.get(KITCHEN_KEY) || defaultKitchen)
  }

  function getStoredMenus() {
    const stored = storage.get(MENUS_KEY)
    return clone(Array.isArray(stored) ? stored : defaultMenus)
  }

  function getStoredWishes() {
    const stored = storage.get(WISHES_KEY)
    return sortWishes(clone(Array.isArray(stored) ? stored : []))
  }

  return {
    async getAccessState() {
      return { role: 'family', memberId: 'cook-a' }
    },

    async bindFamily() {
      return { role: 'family', memberId: 'cook-a' }
    },

    async getKitchen() {
      return clone(getStoredKitchen())
    },

    async saveKitchen(kitchen) {
      const normalized = normalizeKitchen(kitchen)
      storage.set(KITCHEN_KEY, clone(normalized))
      return clone(normalized)
    },

    async listMenus() {
      return getStoredMenus()
    },

    async getMenu(id) {
      return getStoredMenus().find((menu) => menu.id === id) || null
    },

    async saveMenu(menu) {
      const menus = getStoredMenus()
      const now = Date.now()
      const record = {
        imageUrls: [],
        note: '',
        ...clone(menu),
        id: menu.id || `menu-${now}-${Math.random().toString(16).slice(2)}`,
        createdAt: menu.createdAt || now,
        updatedAt: now,
      }
      const index = menus.findIndex((item) => item.id === record.id)
      if (index >= 0) menus.splice(index, 1, record)
      else menus.push(record)
      storage.set(MENUS_KEY, clone(menus))
      return clone(record)
    },

    async deleteMenu(id) {
      storage.set(MENUS_KEY, getStoredMenus().filter((menu) => menu.id !== id))
    },

    async listWishes() {
      return getStoredWishes()
    },

    async getWish(id) {
      return getStoredWishes().find((wish) => wish.id === id) || null
    },

    async saveWish(wish) {
      const wishes = getStoredWishes()
      const now = Date.now()
      const record = {
        coverUrl: '',
        imageUrls: [],
        source: '',
        tastedAt: '',
        note: '',
        ...clone(wish),
        id: wish.id || `wish-${now}-${Math.random().toString(16).slice(2)}`,
        createdAt: wish.createdAt || now,
        updatedAt: now,
      }
      const index = wishes.findIndex((item) => item.id === record.id)
      if (index >= 0) wishes.splice(index, 1, record)
      else wishes.push(record)
      storage.set(WISHES_KEY, clone(wishes))
      return clone(record)
    },

    async deleteWish(id) {
      storage.set(WISHES_KEY, getStoredWishes().filter((wish) => wish.id !== id))
    },
  }
}
