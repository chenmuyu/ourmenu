const DEFAULT_MEMBERS = [
  { id: 'cook-a', name: '第一位', avatarUrl: '' },
  { id: 'cook-b', name: '第二位', avatarUrl: '' },
]

export function getMenusByCook(menus = [], cookId) {
  if (!Array.isArray(menus)) return []

  return menus
    .filter((menu) => menu.cookId === cookId)
    .sort((left, right) => {
      const dateDifference = String(right.cookedAt || '').localeCompare(String(left.cookedAt || ''))
      return dateDifference || Number(right.createdAt || 0) - Number(left.createdAt || 0)
    })
}

export function validateMenu(menu = {}, members = []) {
  if (!String(menu.name || '').trim()) return { valid: false, message: '请填写菜名' }
  if (!menu.cookId) return { valid: false, message: '请选择掌勺人' }
  if (!menu.coverUrl) return { valid: false, message: '请上传封面图' }
  if (!members.some((member) => member.id === menu.cookId)) {
    return { valid: false, message: '掌勺人不属于当前厨房' }
  }
  return { valid: true, message: '' }
}

export function normalizeKitchen(kitchen = {}) {
  const inputMembers = Array.isArray(kitchen.members) ? kitchen.members.slice(0, 2) : []
  const members = DEFAULT_MEMBERS.map((fallback, index) => ({
    ...fallback,
    ...(inputMembers[index] || {}),
  }))

  return {
    id: kitchen.id || 'local-kitchen',
    name: kitchen.name || '两人菜单',
    ...kitchen,
    members,
  }
}
