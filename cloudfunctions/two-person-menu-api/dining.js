const crypto = require('crypto')

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

function formatShanghaiDate(timestamp = Date.now()) {
  const parts = SHANGHAI_DATE_FORMATTER.formatToParts(new Date(timestamp))
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function getDiningInviteStatus(invite = {}, now = Date.now()) {
  if (!isValidDateString(invite.diningDate)) return 'closed'
  return formatShanghaiDate(now) <= invite.diningDate ? 'open' : 'closed'
}

function uniqueStrings(values = [], limit = 12, maxLength = 30) {
  if (!Array.isArray(values)) return []
  const result = []
  const seen = new Set()
  for (const item of values) {
    const value = String(item || '').trim().slice(0, maxLength)
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
    if (result.length >= limit) break
  }
  return result
}

function normalizeCustomDishNames(names = []) {
  return uniqueStrings(names, 12, 30)
}

function normalizeDiningInviteInput(invite = {}) {
  const theme = String(invite.theme || '').trim().slice(0, 40)
  const diningDate = String(invite.diningDate || '')
  if (!theme) throw new Error('请填写聚餐主题')
  if (!isValidDateString(diningDate)) throw new Error('请选择正确的就餐日期')
  return {
    theme,
    diningDate,
    imageUrls: uniqueStrings(invite.imageUrls, 9, 500),
  }
}

function normalizeDiningOrderInput(order = {}) {
  return {
    participantName: String(order.participantName || '').trim().slice(0, 20),
    menuIds: uniqueStrings(order.menuIds, 100, 100),
    customDishNames: normalizeCustomDishNames(order.customDishNames),
  }
}

function orderDocumentId(inviteId, openid) {
  const digest = crypto.createHash('sha256').update(`${inviteId}:${openid}`).digest('hex')
  return `order-${digest.slice(0, 48)}`
}

function participantNameForAccess(access, kitchen, suppliedName) {
  if (access.role === 'family') {
    const member = (kitchen.members || []).find((item) => item.id === access.memberId)
    return String(member?.name || '家庭成员').trim().slice(0, 20)
  }
  return String(suppliedName || '').trim().slice(0, 20) || '客人'
}

function buildMenuSnapshots(menuIds = [], menus = [], kitchen = {}) {
  const byId = new Map(menus.map((menu) => [String(menu._id || menu.id || ''), menu]))
  const members = new Map((kitchen.members || []).map((member) => [member.id, member]))
  return uniqueStrings(menuIds, 100, 100)
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((menu) => ({
      id: String(menu._id || menu.id || ''),
      name: String(menu.name || '').trim(),
      cookId: String(menu.cookId || ''),
      cookName: String(members.get(menu.cookId)?.name || ''),
      groupId: String(menu.groupId || ''),
      tagIds: Array.isArray(menu.tagIds) ? menu.tagIds.slice(0, 12) : [],
      thumbnailUrl: String(menu.coverUrl || menu.imageUrls?.[0] || '').trim(),
    }))
}

function publicDiningInvite(record, now = Date.now()) {
  if (!record) return null
  const { _id, _openid, createdBy, ...fields } = record
  return { id: _id || record.id, ...fields, status: getDiningInviteStatus(record, now) }
}

function publicDiningOrder(record) {
  if (!record) return null
  const { _id, _openid, participantOpenid, ...fields } = record
  return { id: _id || record.id, ...fields }
}

module.exports = {
  buildMenuSnapshots,
  formatShanghaiDate,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  normalizeDiningInviteInput,
  normalizeDiningOrderInput,
  orderDocumentId,
  participantNameForAccess,
  publicDiningInvite,
  publicDiningOrder,
}
