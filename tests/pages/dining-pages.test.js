import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pagesConfig = JSON.parse(readFileSync(new URL('../../src/pages.json', import.meta.url), 'utf8'))
const homeSource = readFileSync(new URL('../../src/pages/home/index.vue', import.meta.url), 'utf8')
const createSource = readFileSync(new URL('../../src/pages/dining-create/index.vue', import.meta.url), 'utf8')
const recordsSource = readFileSync(new URL('../../src/pages/dining-records/index.vue', import.meta.url), 'utf8')
const orderSource = readFileSync(new URL('../../src/pages/dining-order/index.vue', import.meta.url), 'utf8')
const manageSource = readFileSync(new URL('../../src/pages/dining-manage/index.vue', import.meta.url), 'utf8')

describe('点菜邀请页面', () => {
  it('注册四个独立页面且不增加底部标签', () => {
    const pagePaths = pagesConfig.pages.map((page) => page.path)
    expect(pagePaths).toEqual(
      expect.arrayContaining([
        'pages/dining-create/index',
        'pages/dining-order/index',
        'pages/dining-records/index',
        'pages/dining-manage/index',
      ]),
    )
    expect(pagesConfig.tabBar.list).toHaveLength(2)
    ;['dining-create', 'dining-order', 'dining-records', 'dining-manage'].forEach((name) => {
      expect(existsSync(new URL(`../../src/pages/${name}/index.vue`, import.meta.url))).toBe(true)
    })
  })

  it('主人首页提供创建邀请和点菜记录入口', () => {
    expect(homeSource).toContain('欢迎点菜')
    expect(homeSource).toContain('点菜记录')
    expect(homeSource).toContain("uni.navigateTo({ url: '/pages/dining-create/index' })")
    expect(homeSource).toContain("uni.navigateTo({ url: '/pages/dining-records/index' })")
    expect(homeSource).toContain('v-if="isFamily"')
  })

  it('主人选择日期和主题后创建邀请', () => {
    expect(createSource).toContain('mode="date"')
    expect(createSource).toContain('v-model="form.theme"')
    expect(createSource).toContain('validateDiningInvite')
    expect(createSource).toContain('repository.createDiningInvite')
    expect(createSource).toContain('/pages/dining-manage/index?id=')
    expect(createSource).toContain("access.role !== 'family'")
  })

  it('主人查看包含状态和汇总信息的历次邀请', () => {
    expect(recordsSource).toContain('repository.listDiningInvites')
    expect(recordsSource).toContain("access.role !== 'family'")
    expect(recordsSource).toContain('invite.participantCount')
    expect(recordsSource).toContain('invite.dishCount')
    expect(recordsSource).toContain("invite.status === 'open'")
    expect(recordsSource).toContain('/pages/dining-manage/index?id=')
  })

  it('分享点菜页恢复本人选择并支持公共筛选和手动菜名', () => {
    expect(orderSource).toContain('repository.getDiningInvite')
    expect(orderSource).toContain('repository.getKitchen')
    expect(orderSource).toContain('repository.listMenus')
    expect(orderSource).toContain('loadAccess(repository)')
    expect(orderSource).toContain('repository.getMyDiningOrder')
    expect(orderSource).toContain('selectedMenuIds')
    expect(orderSource).toContain('selectedGroupId')
    expect(orderSource).toContain('customDishNames')
    expect(orderSource).toContain('v-if="isGuest"')
    expect(orderSource).toContain('掌勺')
  })

  it('点菜页保存当前选择、展示成功结果并在结束后只读', () => {
    expect(orderSource).toContain('repository.saveMyDiningOrder')
    expect(orderSource).toContain('再改改')
    expect(orderSource).toContain("invite.value.status === 'closed'")
    expect(orderSource).toContain('至少选择或输入一道菜')
  })

  it('点菜页分享同一邀请并使用约定文案', () => {
    expect(orderSource).toContain('onShareAppMessage')
    expect(orderSource).toContain('欢迎来到粤湘情小菜馆')
    expect(orderSource).toContain('/pages/dining-order/index?id=')
  })

  it('主人管理邀请资料、聚餐图片和参与人的点菜单', () => {
    expect(manageSource).toContain("access.role !== 'family'")
    expect(manageSource).toContain('repository.getDiningInvite')
    expect(manageSource).toContain('repository.listDiningOrders')
    expect(manageSource).toContain('repository.saveDiningInvite')
    expect(manageSource).toContain('repository.saveDiningOrder')
    expect(manageSource).toContain('v-model="form.theme"')
    expect(manageSource).toContain('mode="date"')
    expect(manageSource).toContain('order.menuItems')
    expect(manageSource).toContain('order.customDishNames')
  })

  it('主人管理页上传整次聚餐图片并分享点菜入口', () => {
    expect(manageSource).toContain('chooseImages')
    expect(manageSource).toContain('uploadForCurrentMode')
    expect(manageSource).toContain('mergeImagePaths')
    expect(manageSource).toContain('open-type="share"')
    expect(manageSource).toContain('欢迎来到粤湘情小菜馆')
    expect(manageSource).toContain('/pages/dining-order/index?id=')
  })
})
