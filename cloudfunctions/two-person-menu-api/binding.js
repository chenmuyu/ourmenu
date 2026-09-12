const FAMILY_CODE = '0928'

function resolveAccess(kitchen, openid) {
  const member = (kitchen.members || []).find((item) => item.openid && item.openid === openid)
  if (member) return { role: 'family', memberId: member.id }

  const isFull = (kitchen.members || []).filter((item) => item.openid).length >= 2
  return { role: isFull ? 'guest' : 'unbound', memberId: '' }
}

function bindFamilyMember(kitchen, openid, code) {
  const access = resolveAccess(kitchen, openid)
  if (access.role === 'family') return { changed: false, kitchen, access }
  if (access.role === 'guest') throw new Error('家庭成员已经绑定完成')
  if (String(code || '') !== FAMILY_CODE) throw new Error('家庭码不正确')

  const memberIndex = (kitchen.members || []).findIndex((member) => !member.openid)
  if (memberIndex < 0) throw new Error('家庭成员已经绑定完成')

  const members = kitchen.members.map((member, index) =>
    index === memberIndex ? { ...member, openid } : { ...member },
  )
  const nextKitchen = { ...kitchen, members }
  return {
    changed: true,
    kitchen: nextKitchen,
    access: resolveAccess(nextKitchen, openid),
  }
}

function publicMembers(members = []) {
  return members.map(({ openid, ...member }) => ({ ...member, bound: Boolean(openid) }))
}

function assertCanWrite(access) {
  if (access.role !== 'family') throw new Error('只有家庭成员可以进行这个操作')
}

module.exports = { FAMILY_CODE, assertCanWrite, bindFamilyMember, publicMembers, resolveAccess }
