import { normalizeKitchen } from '../domain/kitchen.js'
import {
  buildMenuSnapshot,
  countOrderDishes,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  validateDiningInvite,
  validateDiningOrder,
} from '../domain/dining.js'
import { sortWishes } from '../domain/wish.js'

const KITCHEN_KEY = 'two-person-menu:kitchen'
const MENUS_KEY = 'two-person-menu:menus'
const WISHES_KEY = 'two-person-menu:wishes'
const DINING_INVITES_KEY = 'two-person-menu:dining-invites'
const DINING_ORDERS_KEY = 'two-person-menu:dining-orders'
const LOCAL_PARTICIPANT_ID = 'local-family-cook-a'

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

  function getStoredDiningInvites() {
    const stored = storage.get(DINING_INVITES_KEY)
    return clone(Array.isArray(stored) ? stored : [])
  }

  function getStoredDiningOrders() {
    const stored = storage.get(DINING_ORDERS_KEY)
    return clone(Array.isArray(stored) ? stored : [])
  }

  function publicDiningInvite(invite) {
    if (!invite) return null
    return { ...clone(invite), status: getDiningInviteStatus(invite) }
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

    async createDiningInvite(invite) {
      const validation = validateDiningInvite(invite)
      if (!validation.valid) throw new Error(validation.message)
      const invites = getStoredDiningInvites()
      const now = Date.now()
      const record = {
        id: `invite-${now}-${Math.random().toString(16).slice(2)}`,
        theme: String(invite.theme).trim(),
        diningDate: invite.diningDate,
        imageUrls: [],
        createdAt: now,
        updatedAt: now,
      }
      invites.push(record)
      storage.set(DINING_INVITES_KEY, clone(invites))
      return publicDiningInvite(record)
    },

    async getDiningInvite(inviteId) {
      return publicDiningInvite(getStoredDiningInvites().find((invite) => invite.id === inviteId))
    },

    async listDiningInvites() {
      const orders = getStoredDiningOrders()
      return getStoredDiningInvites()
        .map((invite) => {
          const matchingOrders = orders.filter((order) => order.inviteId === invite.id)
          return {
            ...publicDiningInvite(invite),
            participantCount: matchingOrders.length,
            dishCount: matchingOrders.reduce((total, order) => total + countOrderDishes(order), 0),
          }
        })
        .sort((left, right) => right.diningDate.localeCompare(left.diningDate) || right.createdAt - left.createdAt)
    },

    async saveDiningInvite(invite) {
      const validation = validateDiningInvite(invite)
      if (!validation.valid) throw new Error(validation.message)
      const invites = getStoredDiningInvites()
      const index = invites.findIndex((item) => item.id === invite.id)
      if (index < 0) throw new Error('点菜邀请不存在')
      const record = {
        ...invites[index],
        theme: String(invite.theme).trim(),
        diningDate: invite.diningDate,
        imageUrls: Array.isArray(invite.imageUrls) ? invite.imageUrls.slice(0, 9) : [],
        updatedAt: Date.now(),
      }
      invites.splice(index, 1, record)
      storage.set(DINING_INVITES_KEY, clone(invites))
      return publicDiningInvite(record)
    },

    async getMyDiningOrder(inviteId) {
      const order = getStoredDiningOrders().find(
        (item) => item.inviteId === inviteId && item.participantId === LOCAL_PARTICIPANT_ID,
      )
      return order ? clone(order) : null
    },

    async saveMyDiningOrder(inviteId, order) {
      const invite = getStoredDiningInvites().find((item) => item.id === inviteId)
      if (!invite) throw new Error('点菜邀请不存在')
      if (getDiningInviteStatus(invite) === 'closed') throw new Error('这次点菜已经结束')

      const kitchen = getStoredKitchen()
      const menuIds = new Set(Array.isArray(order.menuIds) ? order.menuIds : [])
      const orders = getStoredDiningOrders()
      const index = orders.findIndex(
        (item) => item.inviteId === inviteId && item.participantId === LOCAL_PARTICIPANT_ID,
      )
      const currentMenus = new Map(getStoredMenus().map((menu) => [menu.id, menu]))
      const previousItems = new Map((index >= 0 ? orders[index].menuItems : []).map((menu) => [menu.id, menu]))
      const menuItems = [...menuIds]
        .map((id) => {
          const menu = currentMenus.get(id)
          return menu ? buildMenuSnapshot(menu, kitchen) : previousItems.get(id)
        })
        .filter(Boolean)
      const customDishNames = normalizeCustomDishNames(order.customDishNames)
      const validation = validateDiningOrder({ menuItems, customDishNames })
      if (!validation.valid) throw new Error(validation.message)

      const now = Date.now()
      const record = {
        id: index >= 0 ? orders[index].id : `order-${now}-${Math.random().toString(16).slice(2)}`,
        inviteId,
        participantId: LOCAL_PARTICIPANT_ID,
        participantName: kitchen.members[0]?.name || '我',
        menuItems,
        customDishNames,
        createdAt: index >= 0 ? orders[index].createdAt : now,
        updatedAt: now,
      }
      if (index >= 0) orders.splice(index, 1, record)
      else orders.push(record)
      storage.set(DINING_ORDERS_KEY, clone(orders))
      return clone(record)
    },

    async listDiningOrders(inviteId) {
      return getStoredDiningOrders()
        .filter((order) => order.inviteId === inviteId)
        .sort((left, right) => right.updatedAt - left.updatedAt)
    },

    async saveDiningOrder(inviteId, order) {
      const orders = getStoredDiningOrders()
      const index = orders.findIndex((item) => item.id === order.id && item.inviteId === inviteId)
      if (index < 0) throw new Error('点菜单不存在')
      const customDishNames = normalizeCustomDishNames(order.customDishNames)
      const record = {
        ...orders[index],
        participantName: String(order.participantName ?? orders[index].participantName).trim().slice(0, 20),
        customDishNames,
        updatedAt: Date.now(),
      }
      const validation = validateDiningOrder(record)
      if (!validation.valid) throw new Error(validation.message)
      orders.splice(index, 1, record)
      storage.set(DINING_ORDERS_KEY, clone(orders))
      return clone(record)
    },
  }
}
