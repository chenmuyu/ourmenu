export function getMenusByCook(menus = [], cookId, groupId = '') {
  if (!Array.isArray(menus)) return []

  return menus
    .filter((menu) => menu.cookId === cookId && (!groupId || menu.groupId === groupId))
    .sort((left, right) => {
      const dateDifference = String(right.cookedAt || '').localeCompare(String(left.cookedAt || ''))
      return dateDifference || Number(right.createdAt || 0) - Number(left.createdAt || 0)
    })
}

export function getMenuThumbnail(menu = {}) {
  return String(menu.coverUrl || menu.imageUrls?.[0] || '').trim()
}

export function validateMenu(menu = {}, members = []) {
  if (!String(menu.name || '').trim()) return { valid: false, message: '请填写菜名' }
  if (!menu.cookId) return { valid: false, message: '请选择掌勺人' }
  if (!members.some((member) => member.id === menu.cookId)) {
    return { valid: false, message: '掌勺人不属于当前厨房' }
  }
  return { valid: true, message: '' }
}

export { normalizeKitchen } from './kitchen.js'
