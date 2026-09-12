export function createCloudRepository({ wxApi = wx } = {}) {
  if (!wxApi?.cloud) throw new Error('微信云开发不可用')

  async function call(action, payload = {}) {
    const response = await wxApi.cloud.callFunction({
      name: 'two-person-menu-api',
      data: { action, ...payload },
    })
    const result = response.result || {}
    if (!result.ok) throw new Error(result.message || '云端操作失败')
    return result.data
  }

  return {
    getAccessState() {
      return call('getAccessState')
    },
    bindFamily(code) {
      return call('bindFamily', { code })
    },
    getKitchen() {
      return call('getKitchen')
    },
    saveKitchen(kitchen) {
      return call('saveKitchen', { kitchen })
    },
    listMenus() {
      return call('listMenus')
    },
    getMenu(id) {
      return call('getMenu', { id })
    },
    saveMenu(menu) {
      return call('saveMenu', { menu })
    },
    deleteMenu(id) {
      return call('deleteMenu', { id })
    },
    listWishes() {
      return call('listWishes')
    },
    getWish(id) {
      return call('getWish', { id })
    },
    saveWish(wish) {
      return call('saveWish', { wish })
    },
    deleteWish(id) {
      return call('deleteWish', { id })
    },
    createDiningInvite(invite) {
      return call('createDiningInvite', { invite })
    },
    getDiningInvite(inviteId) {
      return call('getDiningInvite', { inviteId })
    },
    listDiningInvites() {
      return call('listDiningInvites')
    },
    saveDiningInvite(invite) {
      return call('saveDiningInvite', { invite })
    },
    getMyDiningOrder(inviteId) {
      return call('getMyDiningOrder', { inviteId })
    },
    saveMyDiningOrder(inviteId, order) {
      return call('saveMyDiningOrder', { inviteId, order })
    },
    listDiningOrders(inviteId) {
      return call('listDiningOrders', { inviteId })
    },
    saveDiningOrder(inviteId, order) {
      return call('saveDiningOrder', { inviteId, order })
    },
  }
}
