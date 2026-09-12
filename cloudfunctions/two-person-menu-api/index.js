const cloud = require('wx-server-sdk')
const { assertCanWrite, bindFamilyMember, publicMembers, resolveAccess } = require('./binding')
const {
  buildMenuSnapshots,
  getDiningInviteStatus,
  normalizeCustomDishNames,
  normalizeDiningInviteInput,
  normalizeDiningOrderInput,
  orderDocumentId,
  participantNameForAccess,
  publicDiningInvite,
  publicDiningOrder,
} = require('./dining')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const database = cloud.database()
const kitchens = database.collection('kitchens')
const menus = database.collection('menus')
const wishes = database.collection('wishes')
const diningInvites = database.collection('diningInvites')
const diningOrders = database.collection('diningOrders')
const KITCHEN_SLUG = 'two-person-menu'

const DEFAULT_GROUPS = [
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

const DEFAULT_TAGS = [
  ['meat', '荤菜'],
  ['vegetarian', '素菜'],
  ['signature', '超级拿手菜'],
  ['soupy', '汤汤水水'],
].map(([id, name], order) => ({ id, name, active: true, order }))

function defaultKitchen() {
  const now = Date.now()
  return {
    slug: KITCHEN_SLUG,
    name: '粤湘情',
    backgroundUrl: '',
    members: [
      { id: 'cook-a', name: '我', avatarUrl: '', openid: '' },
      { id: 'cook-b', name: '老公', avatarUrl: '', openid: '' },
    ],
    groups: DEFAULT_GROUPS,
    tags: DEFAULT_TAGS,
    accessModelVersion: 4,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeOptions(items, fallback) {
  const source = Array.isArray(items) && items.length ? items : fallback
  return source.map((item, index) => ({
    id: String(item.id || `item-${index}`),
    name: String(item.name || '').trim(),
    active: item.active !== false,
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
  }))
}

function publicKitchen(kitchen) {
  return {
    id: kitchen._id,
    name: kitchen.name || '粤湘情',
    backgroundUrl: kitchen.backgroundUrl || '',
    members: publicMembers(kitchen.members || []),
    groups: normalizeOptions(kitchen.groups, DEFAULT_GROUPS),
    tags: normalizeOptions(kitchen.tags, DEFAULT_TAGS),
  }
}

function publicRecord(record) {
  if (!record) return null
  const { _id, _openid, ...fields } = record
  return { id: _id, ...fields }
}

async function getOrCreateKitchen() {
  const found = await kitchens.where({ slug: KITCHEN_SLUG }).limit(1).get()
  if (found.data[0]) return found.data[0]

  const created = await kitchens.add({ data: defaultKitchen() })
  return (await kitchens.doc(created._id).get()).data
}

function ensureMenu(menu, kitchen) {
  if (!String(menu?.name || '').trim()) throw new Error('请填写菜名')
  if (!menu?.cookId) throw new Error('请选择掌勺人')
  if (!(kitchen.members || []).some((member) => member.id === menu.cookId)) {
    throw new Error('掌勺人不属于当前厨房')
  }
}

function ensureWish(wish) {
  if (!String(wish?.name || '').trim()) throw new Error('请填写想吃的东西')
  if (!['want', 'again'].includes(wish.status)) throw new Error('请选择记录状态')
}

function cloudFiles(record) {
  return [record?.coverUrl, ...(record?.imageUrls || [])].filter((url) => String(url).startsWith('cloud://'))
}

async function getDocumentOrNull(collection, id) {
  if (!id) return null
  try {
    return (await collection.doc(id).get()).data
  } catch (error) {
    if (String(error.errMsg || error.message).includes('not found')) return null
    throw error
  }
}

async function loadMenusByIds(menuIds) {
  if (!menuIds.length) return []
  const result = await menus.where({ _id: database.command.in(menuIds) }).limit(100).get()
  return result.data
}

async function bindFamily(payload, openid) {
  const kitchen = await getOrCreateKitchen()
  return database.runTransaction(async (transaction) => {
    const current = (await transaction.collection('kitchens').doc(kitchen._id).get()).data
    const binding = bindFamilyMember(current, openid, payload.code)
    if (binding.changed) {
      await transaction.collection('kitchens').doc(kitchen._id).update({
        data: { members: binding.kitchen.members, accessModelVersion: 4, updatedAt: Date.now() },
      })
    }
    return { ...binding.access, kitchen: publicKitchen(binding.kitchen) }
  })
}

async function handle(action, payload, openid) {
  if (action === 'bindFamily') return bindFamily(payload, openid)

  const kitchen = await getOrCreateKitchen()
  const access = resolveAccess(kitchen, openid)

  if (action === 'getAccessState') return access
  if (action === 'getKitchen') return publicKitchen(kitchen)

  if (action === 'createDiningInvite') {
    assertCanWrite(access)
    const input = normalizeDiningInviteInput(payload.invite)
    const now = Date.now()
    const created = await diningInvites.add({
      data: { ...input, createdBy: openid, createdAt: now, updatedAt: now },
    })
    return { ...publicDiningInvite(await getDocumentOrNull(diningInvites, created._id)), participantCount: 0, dishCount: 0 }
  }

  if (action === 'getDiningInvite') {
    return publicDiningInvite(await getDocumentOrNull(diningInvites, payload.inviteId))
  }

  if (action === 'listDiningInvites') {
    assertCanWrite(access)
    const result = await diningInvites.orderBy('diningDate', 'desc').orderBy('createdAt', 'desc').limit(50).get()
    return Promise.all(
      result.data.map(async (invite) => {
        const orderResult = await diningOrders.where({ inviteId: invite._id }).limit(100).get()
        return {
          ...publicDiningInvite(invite),
          participantCount: orderResult.data.length,
          dishCount: orderResult.data.reduce(
            (total, order) => total + (order.menuItems || []).length + (order.customDishNames || []).length,
            0,
          ),
        }
      }),
    )
  }

  if (action === 'saveDiningInvite') {
    assertCanWrite(access)
    const invite = payload.invite || {}
    const current = await getDocumentOrNull(diningInvites, invite.id)
    if (!current) throw new Error('点菜邀请不存在')
    const input = normalizeDiningInviteInput(invite)
    const data = { ...input, updatedAt: Date.now() }
    await diningInvites.doc(invite.id).update({ data })

    const nextFiles = new Set(cloudFiles(input))
    const removedFiles = cloudFiles(current).filter((file) => !nextFiles.has(file))
    if (removedFiles.length) await cloud.deleteFile({ fileList: removedFiles })
    return publicDiningInvite({ ...current, ...data })
  }

  if (action === 'getMyDiningOrder') {
    const id = orderDocumentId(payload.inviteId, openid)
    return publicDiningOrder(await getDocumentOrNull(diningOrders, id))
  }

  if (action === 'saveMyDiningOrder') {
    const invite = await getDocumentOrNull(diningInvites, payload.inviteId)
    if (!invite) throw new Error('点菜邀请不存在')
    if (getDiningInviteStatus(invite) === 'closed') throw new Error('这次点菜已经结束')

    const input = normalizeDiningOrderInput(payload.order)
    const id = orderDocumentId(payload.inviteId, openid)
    const current = await getDocumentOrNull(diningOrders, id)
    const menuRecords = await loadMenusByIds(input.menuIds)
    const menuItems = buildMenuSnapshots(input.menuIds, menuRecords, kitchen, current?.menuItems || [])
    if (!menuItems.length && !input.customDishNames.length) throw new Error('至少选择或输入一道菜')

    const now = Date.now()
    const data = {
      inviteId: payload.inviteId,
      participantOpenid: openid,
      participantName: participantNameForAccess(access, kitchen, input.participantName),
      menuItems,
      customDishNames: input.customDishNames,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    }
    await diningOrders.doc(id).set({ data })
    return publicDiningOrder({ _id: id, ...data })
  }

  if (action === 'listDiningOrders') {
    assertCanWrite(access)
    const invite = await getDocumentOrNull(diningInvites, payload.inviteId)
    if (!invite) throw new Error('点菜邀请不存在')
    const result = await diningOrders.where({ inviteId: payload.inviteId }).orderBy('updatedAt', 'desc').limit(100).get()
    return result.data.map(publicDiningOrder)
  }

  if (action === 'saveDiningOrder') {
    assertCanWrite(access)
    const order = payload.order || {}
    const current = await getDocumentOrNull(diningOrders, order.id)
    if (!current || current.inviteId !== payload.inviteId) throw new Error('点菜单不存在')
    const customDishNames = normalizeCustomDishNames(order.customDishNames)
    if (!(current.menuItems || []).length && !customDishNames.length) throw new Error('至少选择或输入一道菜')
    const data = {
      participantName: String(order.participantName ?? current.participantName).trim().slice(0, 20) || '客人',
      customDishNames,
      updatedAt: Date.now(),
    }
    await diningOrders.doc(order.id).update({ data })
    return publicDiningOrder({ ...current, ...data })
  }

  if (action === 'saveKitchen') {
    assertCanWrite(access)
    const input = payload.kitchen || {}
    const members = kitchen.members.map((member, index) => ({
      ...member,
      name: String(input.members?.[index]?.name || member.name).trim(),
      avatarUrl: input.members?.[index]?.avatarUrl || '',
    }))
    if (members.some((member) => !member.name)) throw new Error('请填写两个人的名字')

    const data = {
      name: String(input.name || '粤湘情').trim() || '粤湘情',
      backgroundUrl: String(input.backgroundUrl || '').trim(),
      members,
      groups: normalizeOptions(input.groups, kitchen.groups || DEFAULT_GROUPS),
      tags: normalizeOptions(input.tags, kitchen.tags || DEFAULT_TAGS),
      updatedAt: Date.now(),
    }
    await kitchens.doc(kitchen._id).update({ data })
    return publicKitchen({ ...kitchen, ...data })
  }

  if (action === 'listMenus') {
    const result = await menus.orderBy('cookedAt', 'desc').orderBy('createdAt', 'desc').limit(100).get()
    return result.data.map(publicRecord)
  }

  if (action === 'getMenu') {
    if (!payload.id) return null
    try {
      return publicRecord((await menus.doc(payload.id).get()).data)
    } catch (error) {
      if (String(error.errMsg || error.message).includes('not found')) return null
      throw error
    }
  }

  if (action === 'saveMenu') {
    assertCanWrite(access)
    const menu = payload.menu || {}
    ensureMenu(menu, kitchen)
    const now = Date.now()
    const data = {
      name: menu.name.trim(),
      cookId: menu.cookId,
      cookedAt: menu.cookedAt || new Date().toISOString().slice(0, 10),
      groupId: String(menu.groupId || 'other'),
      tagIds: Array.isArray(menu.tagIds) ? menu.tagIds.slice(0, 12) : [],
      coverUrl: String(menu.coverUrl || ''),
      imageUrls: Array.isArray(menu.imageUrls) ? menu.imageUrls.slice(0, 9) : [],
      note: String(menu.note || '').slice(0, 300),
      updatedAt: now,
    }
    if (menu.id) {
      await menus.doc(menu.id).update({ data })
      return publicRecord((await menus.doc(menu.id).get()).data)
    }
    const created = await menus.add({ data: { ...data, createdAt: now } })
    return publicRecord((await menus.doc(created._id).get()).data)
  }

  if (action === 'deleteMenu') {
    assertCanWrite(access)
    const current = await menus.doc(payload.id).get()
    await menus.doc(payload.id).remove()
    const fileList = cloudFiles(current.data)
    if (fileList.length) await cloud.deleteFile({ fileList })
    return true
  }

  if (action === 'listWishes') {
    const result = await wishes.orderBy('updatedAt', 'desc').limit(100).get()
    return result.data.map(publicRecord)
  }

  if (action === 'getWish') {
    if (!payload.id) return null
    try {
      return publicRecord((await wishes.doc(payload.id).get()).data)
    } catch (error) {
      if (String(error.errMsg || error.message).includes('not found')) return null
      throw error
    }
  }

  if (action === 'saveWish') {
    assertCanWrite(access)
    const wish = payload.wish || {}
    ensureWish(wish)
    const now = Date.now()
    const data = {
      name: wish.name.trim(),
      status: wish.status,
      coverUrl: String(wish.coverUrl || ''),
      imageUrls: Array.isArray(wish.imageUrls) ? wish.imageUrls.slice(0, 9) : [],
      source: String(wish.source || '').slice(0, 60),
      tastedAt: String(wish.tastedAt || ''),
      note: String(wish.note || '').slice(0, 300),
      updatedAt: now,
    }
    if (wish.id) {
      await wishes.doc(wish.id).update({ data })
      return publicRecord((await wishes.doc(wish.id).get()).data)
    }
    const created = await wishes.add({ data: { ...data, createdAt: now } })
    return publicRecord((await wishes.doc(created._id).get()).data)
  }

  if (action === 'deleteWish') {
    assertCanWrite(access)
    const current = await wishes.doc(payload.id).get()
    await wishes.doc(payload.id).remove()
    const fileList = cloudFiles(current.data)
    if (fileList.length) await cloud.deleteFile({ fileList })
    return true
  }

  throw new Error('不支持的操作')
}

exports.main = async (event) => {
  try {
    const { OPENID } = cloud.getWXContext()
    return { ok: true, data: await handle(event.action, event, OPENID) }
  } catch (error) {
    console.error(error)
    return { ok: false, message: error.message || '云端操作失败' }
  }
}
