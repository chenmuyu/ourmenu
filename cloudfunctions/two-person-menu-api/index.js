const cloud = require('wx-server-sdk')
const { migrateToSharedAccess } = require('./binding')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const database = cloud.database()
const kitchens = database.collection('kitchens')
const menus = database.collection('menus')
const KITCHEN_SLUG = 'two-person-menu'

function publicKitchen(kitchen) {
  return {
    id: kitchen._id,
    name: kitchen.name || '两人菜单',
    members: kitchen.members.map(({ openid, ...member }) => member),
  }
}

function publicMenu(menu) {
  if (!menu) return null
  const { _id, _openid, ...fields } = menu
  return { id: _id, ...fields }
}

async function getSharedKitchen() {
  const found = await kitchens.where({ slug: KITCHEN_SLUG }).limit(1).get()
  let kitchen = found.data[0]

  if (!kitchen) {
    const created = await kitchens.add({
      data: {
        slug: KITCHEN_SLUG,
        name: '两人菜单',
        members: [
          { id: 'cook-a', name: '第一位', avatarUrl: '' },
          { id: 'cook-b', name: '第二位', avatarUrl: '' },
        ],
        developerOpenids: [],
        accessModelVersion: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    })
    kitchen = (await kitchens.doc(created._id).get()).data
  }

  const migration = migrateToSharedAccess(kitchen)
  if (migration.changed) {
    kitchen = migration.kitchen
    await kitchens.doc(kitchen._id).update({
      data: {
        members: kitchen.members,
        developerOpenids: kitchen.developerOpenids,
        accessModelVersion: kitchen.accessModelVersion,
        updatedAt: Date.now(),
      },
    })
  }

  return kitchen
}

function ensureMenu(menu, kitchen) {
  if (!String(menu?.name || '').trim()) throw new Error('请填写菜名')
  if (!menu?.cookId) throw new Error('请选择掌勺人')
  if (!menu?.coverUrl) throw new Error('请上传封面图')
  if (!kitchen.members.some((member) => member.id === menu.cookId)) {
    throw new Error('掌勺人不属于当前厨房')
  }
}

async function handle(action, payload) {
  const kitchen = await getSharedKitchen()

  if (action === 'getKitchen') return publicKitchen(kitchen)

  if (action === 'saveKitchen') {
    const input = payload.kitchen || {}
    const members = kitchen.members.map((member, index) => ({
      ...member,
      name: String(input.members?.[index]?.name || member.name).trim(),
      avatarUrl: input.members?.[index]?.avatarUrl || '',
    }))
    if (members.some((member) => !member.name)) throw new Error('请填写两个人的名字')
    const name = String(input.name || '两人菜单').trim() || '两人菜单'
    await kitchens.doc(kitchen._id).update({ data: { name, members, updatedAt: Date.now() } })
    return publicKitchen({ ...kitchen, name, members })
  }

  if (action === 'listMenus') {
    const result = await menus.orderBy('cookedAt', 'desc').orderBy('createdAt', 'desc').limit(100).get()
    return result.data.map(publicMenu)
  }

  if (action === 'getMenu') {
    if (!payload.id) return null
    try {
      return publicMenu((await menus.doc(payload.id).get()).data)
    } catch (error) {
      if (String(error.errMsg || error.message).includes('not found')) return null
      throw error
    }
  }

  if (action === 'saveMenu') {
    const menu = payload.menu || {}
    ensureMenu(menu, kitchen)
    const now = Date.now()
    const data = {
      name: menu.name.trim(),
      cookId: menu.cookId,
      cookedAt: menu.cookedAt || new Date().toISOString().slice(0, 10),
      coverUrl: menu.coverUrl,
      imageUrls: Array.isArray(menu.imageUrls) ? menu.imageUrls.slice(0, 9) : [],
      note: String(menu.note || '').slice(0, 300),
      updatedAt: now,
    }
    if (menu.id) {
      await menus.doc(menu.id).update({ data })
      return publicMenu((await menus.doc(menu.id).get()).data)
    }
    const created = await menus.add({ data: { ...data, createdAt: now } })
    return publicMenu((await menus.doc(created._id).get()).data)
  }

  if (action === 'deleteMenu') {
    const current = await menus.doc(payload.id).get()
    const fileList = [current.data.coverUrl, ...(current.data.imageUrls || [])].filter((url) =>
      String(url).startsWith('cloud://'),
    )
    await menus.doc(payload.id).remove()
    if (fileList.length) await cloud.deleteFile({ fileList })
    return true
  }

  throw new Error('不支持的操作')
}

exports.main = async (event) => {
  try {
    return { ok: true, data: await handle(event.action, event) }
  } catch (error) {
    console.error(error)
    return { ok: false, message: error.message || '云端操作失败' }
  }
}
