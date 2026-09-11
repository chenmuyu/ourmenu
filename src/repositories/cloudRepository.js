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
  }
}
