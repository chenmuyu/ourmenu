export function createHomeSharePayload(kitchenName) {
  const name = String(kitchenName || '').trim() || '两人菜单'
  return {
    title: `邀请你看看${name}`,
    path: '/pages/home/index',
  }
}
