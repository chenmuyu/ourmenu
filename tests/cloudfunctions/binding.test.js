import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { bindFamilyMember, publicMembers, resolveAccess } = require('../../cloudfunctions/two-person-menu-api/binding.js')

function kitchen(openids = ['', '']) {
  return {
    members: [
      { id: 'cook-a', name: '我', avatarUrl: '', openid: openids[0] },
      { id: 'cook-b', name: '老公', avatarUrl: '', openid: openids[1] },
    ],
  }
}

describe('resolveAccess', () => {
  it('家庭名额未满时未绑定用户需要先绑定', () => {
    expect(resolveAccess(kitchen(['wife-openid', '']), 'new-openid')).toEqual({ role: 'unbound', memberId: '' })
  })

  it('已绑定 OPENID 是家庭成员', () => {
    expect(resolveAccess(kitchen(['wife-openid', 'husband-openid']), 'husband-openid')).toEqual({
      role: 'family',
      memberId: 'cook-b',
    })
  })

  it('两位家庭成员已满时第三人自动成为客人', () => {
    expect(resolveAccess(kitchen(['wife-openid', 'husband-openid']), 'guest-openid')).toEqual({
      role: 'guest',
      memberId: '',
    })
  })
})

describe('bindFamilyMember', () => {
  it('正确家庭码把当前 OPENID 绑定到第一个空位', () => {
    const result = bindFamilyMember(kitchen(['wife-openid', '']), 'husband-openid', '0928')

    expect(result.changed).toBe(true)
    expect(result.kitchen.members[1].openid).toBe('husband-openid')
    expect(result.access).toEqual({ role: 'family', memberId: 'cook-b' })
  })

  it('错误家庭码不会修改家庭成员', () => {
    expect(() => bindFamilyMember(kitchen(), 'wife-openid', '0000')).toThrow('家庭码不正确')
  })

  it('家庭名额已满时第三人不能绑定', () => {
    expect(() => bindFamilyMember(kitchen(['wife-openid', 'husband-openid']), 'guest-openid', '0928')).toThrow(
      '家庭成员已经绑定完成',
    )
  })
})

describe('publicMembers', () => {
  it('返回成员资料时不暴露 OPENID', () => {
    expect(publicMembers(kitchen(['wife-openid', 'husband-openid']).members)).toEqual([
      { id: 'cook-a', name: '我', avatarUrl: '', bound: true },
      { id: 'cook-b', name: '老公', avatarUrl: '', bound: true },
    ])
  })
})
