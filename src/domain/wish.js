export const WISH_STATUSES = [
  { id: 'want', name: '想吃' },
  { id: 'again', name: '吃过还想吃' },
]

export function validateWish(wish = {}) {
  if (!String(wish.name || '').trim()) return { valid: false, message: '请填写想吃的东西' }
  if (!WISH_STATUSES.some((status) => status.id === wish.status)) {
    return { valid: false, message: '请选择记录状态' }
  }
  return { valid: true, message: '' }
}

export function sortWishes(wishes = []) {
  if (!Array.isArray(wishes)) return []
  return [...wishes].sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0))
}

export function getWishThumbnail(wish = {}) {
  return String(wish.coverUrl || wish.imageUrls?.[0] || '').trim()
}
