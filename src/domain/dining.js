const SHANGHAI_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function isValidDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return false
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  )
}

export function formatShanghaiDate(timestamp = Date.now()) {
  const parts = SHANGHAI_DATE_FORMATTER.formatToParts(new Date(timestamp))
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function getDiningInviteStatus(invite = {}, now = Date.now()) {
  if (!isValidDateString(invite.diningDate)) return 'closed'
  return formatShanghaiDate(now) <= invite.diningDate ? 'open' : 'closed'
}

export function normalizeCustomDishNames(names = [], limit = 12, maxLength = 30) {
  if (!Array.isArray(names)) return []
  const normalized = []
  const seen = new Set()

  for (const name of names) {
    const value = String(name || '').trim().slice(0, maxLength)
    if (!value || seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
    if (normalized.length >= limit) break
  }

  return normalized
}

export function validateDiningInvite(invite = {}) {
  if (!String(invite.theme || '').trim()) return { valid: false, message: '请填写聚餐主题' }
  if (!isValidDateString(invite.diningDate)) return { valid: false, message: '请选择正确的就餐日期' }
  return { valid: true, message: '' }
}

export function buildMenuSnapshot(menu = {}, kitchen = {}) {
  const member = (kitchen.members || []).find((item) => item.id === menu.cookId)
  return {
    id: String(menu.id || ''),
    name: String(menu.name || '').trim(),
    cookId: String(menu.cookId || ''),
    cookName: String(member?.name || ''),
    groupId: String(menu.groupId || ''),
    tagIds: Array.isArray(menu.tagIds) ? menu.tagIds.slice(0, 12) : [],
    thumbnailUrl: String(menu.coverUrl || menu.imageUrls?.[0] || '').trim(),
  }
}

export function validateDiningOrder(order = {}) {
  const menuItems = Array.isArray(order.menuItems) ? order.menuItems.filter((item) => item?.id || item?.name) : []
  const customDishNames = normalizeCustomDishNames(order.customDishNames)
  if (!menuItems.length && !customDishNames.length) return { valid: false, message: '至少选择或输入一道菜' }
  return { valid: true, message: '' }
}

export function countOrderDishes(order = {}) {
  const menuItems = Array.isArray(order.menuItems) ? order.menuItems : []
  return menuItems.length + normalizeCustomDishNames(order.customDishNames).length
}
