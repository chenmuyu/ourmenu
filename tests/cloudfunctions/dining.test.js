import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

describe('cloud dining helpers', () => {
  it('按北京时间计算点菜邀请状态', () => {
    const { getDiningInviteStatus } = require('../../cloudfunctions/two-person-menu-api/dining.js')

    expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 15, 59))).toBe('open')
    expect(getDiningInviteStatus({ diningDate: '2026-09-12' }, Date.UTC(2026, 8, 12, 16, 0))).toBe('closed')
  })

  it('校验和规范化邀请字段', () => {
    const { normalizeDiningInviteInput } = require('../../cloudfunctions/two-person-menu-api/dining.js')

    expect(() => normalizeDiningInviteInput({ theme: '', diningDate: '2026-09-20' })).toThrow('请填写聚餐主题')
    expect(() => normalizeDiningInviteInput({ theme: '家宴', diningDate: '2026/09/20' })).toThrow(
      '请选择正确的就餐日期',
    )
    expect(normalizeDiningInviteInput({ theme: '  周末家宴  ', diningDate: '2026-09-20', imageUrls: ['a', 'b'] })).toEqual({
      theme: '周末家宴',
      diningDate: '2026-09-20',
      imageUrls: ['a', 'b'],
    })
  })

  it('规范化个人点菜单并清理手动菜名', () => {
    const { normalizeDiningOrderInput } = require('../../cloudfunctions/two-person-menu-api/dining.js')

    expect(
      normalizeDiningOrderInput({
        participantName: '  妈妈  ',
        menuIds: ['menu-1', 'menu-1', '', 'menu-2'],
        customDishNames: ['  烤串 ', '烤串', '', '小龙虾'],
      }),
    ).toEqual({
      participantName: '妈妈',
      menuIds: ['menu-1', 'menu-2'],
      customDishNames: ['烤串', '小龙虾'],
    })
  })

  it('为邀请和 OpenID 生成稳定且不暴露身份的订单 ID', () => {
    const { orderDocumentId } = require('../../cloudfunctions/two-person-menu-api/dining.js')

    const first = orderDocumentId('invite-1', 'guest-openid')
    expect(first).toBe(orderDocumentId('invite-1', 'guest-openid'))
    expect(first).not.toContain('guest-openid')
    expect(first).not.toBe(orderDocumentId('invite-1', 'other-openid'))
  })

  it('家庭成员使用家庭资料名称，客人称呼保持选填', () => {
    const { participantNameForAccess } = require('../../cloudfunctions/two-person-menu-api/dining.js')
    const kitchen = { members: [{ id: 'cook-a', name: '我' }] }

    expect(participantNameForAccess({ role: 'family', memberId: 'cook-a' }, kitchen, '伪造名字')).toBe('我')
    expect(participantNameForAccess({ role: 'guest', memberId: '' }, kitchen, '  妈妈  ')).toBe('妈妈')
    expect(participantNameForAccess({ role: 'guest', memberId: '' }, kitchen, '')).toBe('客人')
  })

  it('从可信菜谱生成包含掌勺人的历史快照', () => {
    const { buildMenuSnapshots } = require('../../cloudfunctions/two-person-menu-api/dining.js')
    const menus = [
      {
        _id: 'menu-1',
        name: '清蒸鲈鱼',
        cookId: 'cook-a',
        groupId: 'fish',
        tagIds: ['signature'],
        imageUrls: ['/fish.jpg'],
      },
    ]
    const kitchen = { members: [{ id: 'cook-a', name: '我' }] }

    expect(buildMenuSnapshots(['menu-1'], menus, kitchen)).toEqual([
      {
        id: 'menu-1',
        name: '清蒸鲈鱼',
        cookId: 'cook-a',
        cookName: '我',
        groupId: 'fish',
        tagIds: ['signature'],
        thumbnailUrl: '/fish.jpg',
      },
    ])
  })

  it('菜谱删除后继续保留点菜单里的历史快照', () => {
    const { buildMenuSnapshots } = require('../../cloudfunctions/two-person-menu-api/dining.js')
    const historical = {
      id: 'menu-1',
      name: '清蒸鲈鱼',
      cookId: 'cook-a',
      cookName: '我',
      groupId: 'fish',
      tagIds: ['signature'],
      thumbnailUrl: '/fish.jpg',
    }

    expect(buildMenuSnapshots(['menu-1'], [], { members: [] }, [historical])).toEqual([historical])
  })

  it('公开数据不会暴露创建人和点菜人 OpenID', () => {
    const { publicDiningInvite, publicDiningOrder } = require('../../cloudfunctions/two-person-menu-api/dining.js')
    const invite = publicDiningInvite({
      _id: 'invite-1',
      _openid: 'system-openid',
      createdBy: 'wife-openid',
      theme: '家宴',
      diningDate: '2099-09-28',
    })
    const order = publicDiningOrder({
      _id: 'order-1',
      _openid: 'system-openid',
      participantOpenid: 'guest-openid',
      inviteId: 'invite-1',
      participantName: '妈妈',
    })

    expect(invite).toMatchObject({ id: 'invite-1', theme: '家宴', status: 'open' })
    expect(invite).not.toHaveProperty('createdBy')
    expect(invite).not.toHaveProperty('_openid')
    expect(order).toEqual({ id: 'order-1', inviteId: 'invite-1', participantName: '妈妈' })
  })

  it('云函数注册点菜邀请动作并保护主人接口', () => {
    const source = readFileSync('cloudfunctions/two-person-menu-api/index.js', 'utf8')
    const actions = [
      'createDiningInvite',
      'getDiningInvite',
      'listDiningInvites',
      'saveDiningInvite',
      'getMyDiningOrder',
      'saveMyDiningOrder',
      'listDiningOrders',
      'saveDiningOrder',
    ]

    actions.forEach((action) => expect(source).toContain(`action === '${action}'`))
    expect(source).toContain("database.collection('diningInvites')")
    expect(source).toContain("database.collection('diningOrders')")
    expect(source).toMatch(/action === 'createDiningInvite'[\s\S]{0,100}assertCanWrite\(access\)/)
    expect(source).toMatch(/action === 'listDiningInvites'[\s\S]{0,100}assertCanWrite\(access\)/)
    expect(source).toMatch(/action === 'saveDiningInvite'[\s\S]{0,100}assertCanWrite\(access\)/)
    expect(source).toMatch(/action === 'listDiningOrders'[\s\S]{0,100}assertCanWrite\(access\)/)
    expect(source).toMatch(/action === 'saveDiningOrder'[\s\S]{0,100}assertCanWrite\(access\)/)
  })
})
