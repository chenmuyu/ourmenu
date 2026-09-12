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
})
