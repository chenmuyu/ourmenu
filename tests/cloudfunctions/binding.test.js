import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { migrateToSharedAccess } = require('../../cloudfunctions/two-person-menu-api/binding.js')

describe('migrateToSharedAccess', () => {
  it('移除旧版微信身份绑定并保留两位掌勺人资料', () => {
    const result = migrateToSharedAccess({
      members: [
        { id: 'cook-a', name: '小陈', avatarUrl: 'cloud://avatar-a', openid: 'desktop-openid' },
        { id: 'cook-b', name: '老公', avatarUrl: 'cloud://avatar-b', openid: 'phone-openid' },
      ],
      developerOpenids: ['desktop-openid'],
      bindingModelVersion: 2,
    })

    expect(result.changed).toBe(true)
    expect(result.kitchen.members).toEqual([
      { id: 'cook-a', name: '小陈', avatarUrl: 'cloud://avatar-a' },
      { id: 'cook-b', name: '老公', avatarUrl: 'cloud://avatar-b' },
    ])
    expect(result.kitchen.developerOpenids).toEqual([])
    expect(result.kitchen.accessModelVersion).toBe(3)
  })

  it('已切换为共享访问的数据不会重复迁移', () => {
    const kitchen = { accessModelVersion: 3, members: [], developerOpenids: [] }
    expect(migrateToSharedAccess(kitchen)).toEqual({ changed: false, kitchen })
  })
})
