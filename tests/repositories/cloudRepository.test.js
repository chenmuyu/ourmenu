import { describe, expect, it } from 'vitest'
import { createCloudRepository } from '../../src/repositories/cloudRepository.js'

function createWxApi() {
  const calls = []
  return {
    calls,
    wxApi: {
      cloud: {
        async callFunction(request) {
          calls.push(request)
          return { result: { ok: true, data: request.data } }
        },
      },
    },
  }
}

describe('cloudRepository', () => {
  it('发送身份和家庭绑定动作', async () => {
    const { calls, wxApi } = createWxApi()
    const repository = createCloudRepository({ wxApi })

    await repository.getAccessState()
    await repository.bindFamily('0928')

    expect(calls.map((call) => call.data)).toEqual([
      { action: 'getAccessState' },
      { action: 'bindFamily', code: '0928' },
    ])
  })

  it('发送想吃记录的增删改查动作', async () => {
    const { calls, wxApi } = createWxApi()
    const repository = createCloudRepository({ wxApi })

    await repository.listWishes()
    await repository.getWish('wish-1')
    await repository.saveWish({ id: 'wish-1', name: '生椰拿铁' })
    await repository.deleteWish('wish-1')

    expect(calls.map((call) => call.data)).toEqual([
      { action: 'listWishes' },
      { action: 'getWish', id: 'wish-1' },
      { action: 'saveWish', wish: { id: 'wish-1', name: '生椰拿铁' } },
      { action: 'deleteWish', id: 'wish-1' },
    ])
  })

  it('发送点菜邀请和个人点菜单动作', async () => {
    const { calls, wxApi } = createWxApi()
    const repository = createCloudRepository({ wxApi })
    const invite = { theme: '周末聚餐', diningDate: '2026-09-20' }
    const changedInvite = { id: 'invite-1', theme: '周日家宴', diningDate: '2026-09-21' }
    const myOrder = { participantName: '妈妈', menuIds: ['menu-1'], customDishNames: ['烤串'] }
    const changedOrder = { id: 'order-1', participantName: '妈妈', customDishNames: ['小龙虾'] }

    await repository.createDiningInvite(invite)
    await repository.getDiningInvite('invite-1')
    await repository.listDiningInvites()
    await repository.saveDiningInvite(changedInvite)
    await repository.getMyDiningOrder('invite-1')
    await repository.saveMyDiningOrder('invite-1', myOrder)
    await repository.listDiningOrders('invite-1')
    await repository.saveDiningOrder('invite-1', changedOrder)

    expect(calls.map((call) => call.data)).toEqual([
      { action: 'createDiningInvite', invite },
      { action: 'getDiningInvite', inviteId: 'invite-1' },
      { action: 'listDiningInvites' },
      { action: 'saveDiningInvite', invite: changedInvite },
      { action: 'getMyDiningOrder', inviteId: 'invite-1' },
      { action: 'saveMyDiningOrder', inviteId: 'invite-1', order: myOrder },
      { action: 'listDiningOrders', inviteId: 'invite-1' },
      { action: 'saveDiningOrder', inviteId: 'invite-1', order: changedOrder },
    ])
  })
})
