import { beforeEach, describe, expect, it } from 'vitest'
import { accessState, applyAccess, canEdit, loadAccess, resetAccess } from '../../src/access/session.js'

describe('access session', () => {
  beforeEach(resetAccess)

  it('加载云端身份并缓存家庭成员状态', async () => {
    const repository = {
      async getAccessState() {
        return { role: 'family', memberId: 'cook-b' }
      },
    }

    await loadAccess(repository)

    expect(accessState.role).toBe('family')
    expect(accessState.memberId).toBe('cook-b')
    expect(canEdit()).toBe(true)
  })

  it('客人没有编辑权限', () => {
    applyAccess({ role: 'guest', memberId: '' })

    expect(canEdit()).toBe(false)
  })
})
