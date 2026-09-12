const DEFAULT_MEMBERS = [
  { id: 'cook-a', name: '我', avatarUrl: '', bound: false },
  { id: 'cook-b', name: '老公', avatarUrl: '', bound: false },
]

export const DEFAULT_GROUPS = [
  ['beef', '牛肉'],
  ['lamb', '羊肉'],
  ['pork', '猪肉'],
  ['chicken', '鸡肉'],
  ['fish', '鱼'],
  ['shrimp', '虾'],
  ['crab', '蟹'],
  ['egg', '蛋类'],
  ['tofu', '豆制品'],
  ['vegetable', '蔬菜'],
  ['staple', '主食'],
  ['soup', '汤羹'],
  ['other', '其他'],
].map(([id, name], order) => ({ id, name, active: true, order }))

export const DEFAULT_TAGS = [
  ['meat', '荤菜'],
  ['vegetarian', '素菜'],
  ['signature', '超级拿手菜'],
  ['soupy', '汤汤水水'],
].map(([id, name], order) => ({ id, name, active: true, order }))

function normalizeOptions(input, defaults) {
  const source = Array.isArray(input) && input.length ? input : defaults
  return source.map((item, index) => ({
    id: item.id || `item-${index}`,
    name: String(item.name || '').trim(),
    active: item.active !== false,
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
  }))
}

export function normalizeKitchen(kitchen = {}) {
  const inputMembers = Array.isArray(kitchen.members) ? kitchen.members.slice(0, 2) : []
  const members = DEFAULT_MEMBERS.map((fallback, index) => ({
    ...fallback,
    ...(inputMembers[index] || {}),
  }))

  return {
    id: kitchen.id || 'local-kitchen',
    ...kitchen,
    name: String(kitchen.name || '粤湘情').trim() || '粤湘情',
    backgroundUrl: String(kitchen.backgroundUrl || '').trim(),
    menuHeroUrl: String(kitchen.menuHeroUrl || kitchen.backgroundUrl || '').trim(),
    members,
    groups: normalizeOptions(kitchen.groups, DEFAULT_GROUPS),
    tags: normalizeOptions(kitchen.tags, DEFAULT_TAGS),
  }
}

export function addManagedOption(items = [], name, prefix, timestamp = Date.now()) {
  const normalizedName = String(name || '').trim()
  if (!normalizedName) throw new Error('名称不能为空')
  if (items.some((item) => String(item.name || '').trim() === normalizedName)) {
    throw new Error('这个名称已经存在')
  }
  return [
    ...items.map((item) => ({ ...item })),
    { id: `${prefix}-${timestamp}`, name: normalizedName, active: true, order: items.length },
  ]
}

export function moveManagedOption(items = [], index, direction) {
  const target = index + direction
  if (index < 0 || target < 0 || index >= items.length || target >= items.length) {
    return items.map((item) => ({ ...item }))
  }
  const next = items.map((item) => ({ ...item }))
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next.map((current, order) => ({ ...current, order }))
}

export function toggleManagedOption(items = [], id) {
  return items.map((item) => (item.id === id ? { ...item, active: item.active === false } : { ...item }))
}
