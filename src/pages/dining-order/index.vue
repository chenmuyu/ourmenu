<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { accessState, loadAccess } from '../../access/session.js'
import {
  buildMenuSnapshot,
  normalizeCustomDishNames,
  validateDiningOrder,
} from '../../domain/dining.js'
import { getMenuThumbnail } from '../../domain/menu.js'
import { repository } from '../../repositories/index.js'

const statusBarHeight = uni.getWindowInfo?.().statusBarHeight || 24
const inviteId = ref('')
const invite = ref({ id: '', theme: '', diningDate: '', status: 'open' })
const kitchen = ref({ name: '粤湘情', members: [], groups: [], tags: [] })
const menus = ref([])
const savedOrder = ref(null)
const selectedMenuIds = ref([])
const customDishNames = ref([])
const customDishInput = ref('')
const participantName = ref('')
const selectedGroupId = ref('')
const loading = ref(true)
const saving = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const isGuest = computed(() => accessState.role !== 'family')
const isClosed = computed(() => invite.value.status === 'closed')
const activeGroups = computed(() => (kitchen.value.groups || []).filter((group) => group.active !== false))
const filteredMenus = computed(() =>
  menus.value.filter((menu) => !selectedGroupId.value || menu.groupId === selectedGroupId.value),
)
const selectedItems = computed(() => {
  const currentMenus = new Map(menus.value.map((menu) => [menu.id, menu]))
  const historicalItems = new Map((savedOrder.value?.menuItems || []).map((menu) => [menu.id, menu]))
  return selectedMenuIds.value
    .map((id) => {
      const current = currentMenus.get(id)
      return current ? buildMenuSnapshot(current, kitchen.value) : historicalItems.get(id)
    })
    .filter(Boolean)
})
const selectedCount = computed(() => selectedItems.value.length + customDishNames.value.length)

function memberName(cookId) {
  return kitchen.value.members.find((member) => member.id === cookId)?.name || '家里掌勺人'
}

function tagNames(menu) {
  const tags = new Map((kitchen.value.tags || []).map((tag) => [tag.id, tag.name]))
  return (menu.tagIds || []).map((id) => tags.get(id)).filter(Boolean).slice(0, 2)
}

function isSelected(id) {
  return selectedMenuIds.value.includes(id)
}

function toggleMenu(id) {
  if (isClosed.value) return
  const index = selectedMenuIds.value.indexOf(id)
  if (index >= 0) selectedMenuIds.value.splice(index, 1)
  else selectedMenuIds.value.push(id)
}

function addCustomDish() {
  if (isClosed.value) return
  const next = normalizeCustomDishNames([...customDishNames.value, customDishInput.value])
  if (!String(customDishInput.value || '').trim()) return
  if (next.length === customDishNames.value.length) {
    uni.showToast({ title: customDishNames.value.length >= 12 ? '最多添加 12 道' : '这道已经写过了', icon: 'none' })
    return
  }
  customDishNames.value = next
  customDishInput.value = ''
}

function removeCustomDish(index) {
  if (isClosed.value) return
  customDishNames.value.splice(index, 1)
}

async function loadPage(options) {
  loading.value = true
  errorMessage.value = ''
  try {
    inviteId.value = decodeURIComponent(options.id || '')
    if (!inviteId.value) throw new Error('点菜邀请不存在')

    await loadAccess(repository)
    const [nextInvite, nextKitchen, nextMenus, currentOrder] = await Promise.all([
      repository.getDiningInvite(inviteId.value),
      repository.getKitchen(),
      repository.listMenus(),
      repository.getMyDiningOrder(inviteId.value),
    ])
    if (!nextInvite) throw new Error('点菜邀请不存在')

    invite.value = nextInvite
    kitchen.value = nextKitchen
    menus.value = nextMenus
    savedOrder.value = currentOrder
    selectedMenuIds.value = (currentOrder?.menuItems || []).map((menu) => menu.id)
    customDishNames.value = normalizeCustomDishNames(currentOrder?.customDishNames)
    participantName.value = currentOrder?.participantName === '客人' ? '' : currentOrder?.participantName || ''
  } catch (error) {
    errorMessage.value = error?.message || '邀请加载失败'
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  if (saving.value || isClosed.value) return
  addCustomDish()
  const order = { menuItems: selectedItems.value, customDishNames: customDishNames.value }
  const validation = validateDiningOrder(order)
  if (!validation.valid) {
    uni.showToast({ title: '至少选择或输入一道菜', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const saved = await repository.saveMyDiningOrder(inviteId.value, {
      participantName: participantName.value,
      menuIds: selectedMenuIds.value,
      customDishNames: customDishNames.value,
    })
    savedOrder.value = saved
    selectedMenuIds.value = (saved.menuItems || []).map((menu) => menu.id)
    customDishNames.value = normalizeCustomDishNames(saved.customDishNames)
    submitted.value = true
  } catch (error) {
    uni.showToast({ title: error?.message || '提交失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function editAgain() {
  if (!isClosed.value) submitted.value = false
}

function leavePage() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.switchTab({ url: '/pages/home/index' })
}

onLoad(loadPage)
onShareAppMessage(() => ({
  title: '欢迎来到粤湘情小菜馆',
  path: `/pages/dining-order/index?id=${encodeURIComponent(inviteId.value)}`,
}))
</script>

<template>
  <view class="order-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="ambient ambient--one" />
    <view class="ambient ambient--two">♡</view>

    <view class="custom-nav">
      <button class="custom-nav__back" aria-label="返回" @tap="leavePage">‹</button>
      <text class="custom-nav__brand">粤湘情小菜馆</text>
      <button class="custom-nav__share" open-type="share" aria-label="转发邀请">↗</button>
    </view>

    <view v-if="loading" class="page-state">正在为你展开菜单…</view>
    <view v-else-if="errorMessage" class="page-state page-state--error" @tap="loadPage({ id: inviteId })">
      <text class="page-state__mark">!</text>
      <text>{{ errorMessage }}</text>
      <text class="page-state__retry">点此重试</text>
    </view>

    <template v-else>
      <view class="invitation-hero">
        <text class="invitation-hero__eyebrow">WELCOME TO OUR TABLE</text>
        <text class="invitation-hero__theme">{{ invite.theme }}</text>
        <view class="invitation-hero__date">
          <text>{{ invite.diningDate }}</text>
          <text class="invitation-hero__dot">·</text>
          <text>{{ isClosed ? '这桌已经开席' : '等你来点菜' }}</text>
        </view>
      </view>

      <view v-if="submitted || isClosed" class="result-card">
        <view class="result-card__seal">{{ isClosed ? '已开席' : '点好啦' }}</view>
        <text class="result-card__title">{{ savedOrder ? '这是你的点菜单' : '这次点菜已经结束' }}</text>
        <text v-if="savedOrder" class="result-card__name">{{ savedOrder.participantName || '客人' }} 点了</text>

        <view v-if="selectedItems.length" class="result-list">
          <view v-for="item in selectedItems" :key="item.id" class="result-item">
            <text class="result-item__mark">✓</text>
            <view>
              <text class="result-item__name">{{ item.name }}</text>
              <text class="result-item__cook">{{ item.cookName || memberName(item.cookId) }} 掌勺</text>
            </view>
          </view>
        </view>
        <view v-if="customDishNames.length" class="result-list result-list--custom">
          <view v-for="name in customDishNames" :key="name" class="result-item">
            <text class="result-item__mark">＋</text>
            <view>
              <text class="result-item__name">{{ name }}</text>
              <text class="result-item__cook">菜单外的小心愿</text>
            </view>
          </view>
        </view>

        <button v-if="!isClosed && savedOrder" class="result-card__edit" @tap="editAgain">再改改</button>
        <text v-if="isClosed" class="result-card__note">仍然可以回来看看，但不能再修改点菜单啦。</text>
      </view>

      <template v-else>
        <view v-if="isGuest" class="guest-name-card">
          <text class="guest-name-card__label">怎么称呼你？<text>（选填）</text></text>
          <input v-model="participantName" maxlength="20" placeholder="例如：妈妈、小王" />
        </view>

        <scroll-view class="group-rail" scroll-x :show-scrollbar="false">
          <view class="group-rail__inner">
            <button class="group-chip" :class="{ 'group-chip--active': !selectedGroupId }" @tap="selectedGroupId = ''">
              全部
            </button>
            <button
              v-for="group in activeGroups"
              :key="group.id"
              class="group-chip"
              :class="{ 'group-chip--active': selectedGroupId === group.id }"
              @tap="selectedGroupId = group.id"
            >
              {{ group.name }}
            </button>
          </view>
        </scroll-view>

        <view class="menu-section">
          <view class="section-heading">
            <text class="section-heading__title">小菜馆菜单</text>
            <text class="section-heading__count">已选 {{ selectedCount }} 道</text>
          </view>
          <view v-if="!filteredMenus.length" class="menu-empty">这个分类还没有菜，看看别的吧</view>
          <button
            v-for="menu in filteredMenus"
            :key="menu.id"
            class="menu-option"
            :class="{ 'menu-option--selected': isSelected(menu.id) }"
            @tap="toggleMenu(menu.id)"
          >
            <image v-if="getMenuThumbnail(menu)" class="menu-option__image" :src="getMenuThumbnail(menu)" mode="aspectFill" />
            <view v-else class="menu-option__fallback">{{ menu.name.slice(0, 1) }}</view>
            <view class="menu-option__copy">
              <text class="menu-option__name">{{ menu.name }}</text>
              <view class="menu-option__meta">
                <text>{{ memberName(menu.cookId) }} 掌勺</text>
                <text v-for="tag in tagNames(menu)" :key="tag" class="menu-option__tag">{{ tag }}</text>
              </view>
            </view>
            <view class="menu-option__check">{{ isSelected(menu.id) ? '✓' : '' }}</view>
          </button>
        </view>

        <view class="custom-card">
          <text class="custom-card__eyebrow">OFF MENU</text>
          <text class="custom-card__title">还想吃点别的？</text>
          <text class="custom-card__copy">菜谱里没有也没关系，直接把名字写下来。</text>
          <view class="custom-card__input-row">
            <input
              v-model="customDishInput"
              maxlength="30"
              confirm-type="done"
              placeholder="输入一道菜名"
              @confirm="addCustomDish"
            />
            <button @tap="addCustomDish">添加</button>
          </view>
          <view v-if="customDishNames.length" class="custom-tags">
            <button v-for="(name, index) in customDishNames" :key="name" @tap="removeCustomDish(index)">
              {{ name }} <text>×</text>
            </button>
          </view>
        </view>

        <view class="submit-spacer" />
        <view class="submit-bar">
          <view class="submit-bar__count">
            <text class="submit-bar__number">{{ selectedCount }}</text>
            <text>道心意</text>
          </view>
          <button :loading="saving" :disabled="saving" @tap="submitOrder">
            {{ saving ? '正在送单…' : '提交点菜' }}
          </button>
        </view>
      </template>
    </template>
  </view>
</template>

<style scoped lang="scss">
.order-page {
  position: relative;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
  overflow-x: hidden;
  background:
    radial-gradient(circle at 88% 5%, rgba(255, 184, 174, 0.4), transparent 24%),
    linear-gradient(160deg, #fffdf9 0%, #fff1ed 56%, #ffddd6 100%);
}

.ambient { position: absolute; z-index: 0; border-radius: 50%; }
.ambient--one { top: 250rpx; right: -90rpx; width: 230rpx; height: 230rpx; border: 2rpx solid rgba(255, 255, 255, 0.72); }
.ambient--two { top: 590rpx; left: 20rpx; display: flex; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; color: rgba(185, 68, 91, 0.44); background: rgba(255, 255, 255, 0.4); font-size: 24rpx; }

.custom-nav {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 26rpx;
}

.custom-nav__back,
.custom-nav__share {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  color: var(--ink);
  background: rgba(255, 253, 249, 0.7);
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  font-size: 38rpx;
  line-height: 1;
}

.custom-nav__share { font-size: 26rpx; }
.custom-nav__brand { color: #875f69; font-size: 20rpx; font-weight: 800; letter-spacing: 4rpx; }

.page-state {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 290rpx 40rpx 0;
  color: var(--muted);
  text-align: center;
}

.page-state__mark { display: flex; align-items: center; justify-content: center; width: 70rpx; height: 70rpx; margin-bottom: 20rpx; color: #fff; background: var(--red-dark); border-radius: 50%; font-size: 32rpx; }
.page-state__retry { margin-top: 18rpx; color: var(--red-dark); font-size: 21rpx; }

.invitation-hero {
  position: relative;
  z-index: 2;
  padding: 38rpx 38rpx 46rpx;
  text-align: center;
}

.invitation-hero__eyebrow,
.invitation-hero__theme { display: block; }
.invitation-hero__eyebrow { color: #b67a58; font-size: 17rpx; font-weight: 800; letter-spacing: 5rpx; }
.invitation-hero__theme { margin-top: 18rpx; color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 62rpx; font-weight: 900; line-height: 1.2; }
.invitation-hero__date { display: flex; justify-content: center; margin-top: 18rpx; color: #916a73; font-size: 22rpx; font-weight: 600; }
.invitation-hero__dot { margin: 0 14rpx; color: var(--red); }

.guest-name-card,
.menu-section,
.custom-card,
.result-card {
  position: relative;
  z-index: 2;
  margin-right: 26rpx;
  margin-left: 26rpx;
  background: rgba(255, 253, 249, 0.91);
  border: 2rpx solid rgba(119, 63, 77, 0.1);
  box-shadow: 0 18rpx 44rpx rgba(111, 50, 66, 0.12);
}

.guest-name-card { padding: 24rpx 26rpx; border-radius: 28rpx 10rpx 28rpx 10rpx; }
.guest-name-card__label { color: #69454e; font-size: 22rpx; font-weight: 800; }
.guest-name-card__label text { color: #ab878d; font-weight: 400; }
.guest-name-card input { height: 72rpx; margin-top: 14rpx; padding: 0 20rpx; color: var(--ink); background: #fff2ed; border-radius: 18rpx 7rpx 18rpx 7rpx; font-size: 25rpx; }

.group-rail { position: relative; z-index: 3; width: 100%; margin: 24rpx 0 18rpx; white-space: nowrap; }
.group-rail__inner { display: inline-flex; gap: 12rpx; padding: 4rpx 26rpx; }
.group-chip { width: auto; height: 60rpx; margin: 0; padding: 0 25rpx; color: #875f69; background: rgba(255, 253, 249, 0.76); border: 2rpx solid rgba(185, 68, 91, 0.12); border-radius: 30rpx 10rpx 30rpx 10rpx; font-size: 22rpx; line-height: 58rpx; }
.group-chip--active { color: #fff; background: var(--ink); border-color: var(--ink); }

.menu-section { padding: 30rpx 24rpx 12rpx; border-radius: 36rpx 14rpx 36rpx 14rpx; }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding: 0 6rpx 22rpx; }
.section-heading__title { color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 39rpx; font-weight: 900; }
.section-heading__count { color: var(--red-dark); font-size: 20rpx; font-weight: 700; }
.menu-empty { padding: 70rpx 20rpx 90rpx; color: #ab878d; font-size: 22rpx; text-align: center; }

.menu-option {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 116rpx;
  margin: 0 0 16rpx;
  padding: 14rpx 16rpx;
  color: var(--ink);
  background: #fff7f2;
  border: 2rpx solid transparent;
  border-radius: 58rpx 14rpx 58rpx 14rpx;
  line-height: 1.3;
  text-align: left;
}

.menu-option--selected { background: #ffede8; border-color: rgba(185, 68, 91, 0.3); box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.5); }
.menu-option__image,
.menu-option__fallback { flex: 0 0 auto; width: 86rpx; height: 86rpx; border-radius: 50%; }
.menu-option__image { border: 4rpx solid #fff; box-shadow: 0 8rpx 18rpx rgba(84, 43, 53, 0.13); }
.menu-option__fallback { display: flex; align-items: center; justify-content: center; color: #fff; background: linear-gradient(145deg, #e9a192, #b9445b); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 35rpx; font-weight: 900; }
.menu-option__copy { flex: 1; min-width: 0; padding: 0 18rpx; }
.menu-option__name { display: block; overflow: hidden; font-size: 28rpx; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.menu-option__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8rpx; margin-top: 9rpx; color: #98757b; font-size: 19rpx; }
.menu-option__tag { padding: 4rpx 9rpx; color: #a24b5c; background: rgba(238, 113, 128, 0.12); border-radius: 9rpx; }
.menu-option__check { display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 42rpx; height: 42rpx; color: #fff; background: #e4d5d1; border-radius: 50%; font-size: 23rpx; font-weight: 900; }
.menu-option--selected .menu-option__check { background: var(--red-dark); }

.custom-card { margin-top: 24rpx; padding: 32rpx 28rpx 30rpx; border-radius: 34rpx 12rpx 34rpx 12rpx; }
.custom-card__eyebrow,
.custom-card__title,
.custom-card__copy { display: block; }
.custom-card__eyebrow { color: #b67a58; font-size: 16rpx; font-weight: 800; letter-spacing: 4rpx; }
.custom-card__title { margin-top: 10rpx; color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 38rpx; font-weight: 900; }
.custom-card__copy { margin-top: 8rpx; color: #9d787f; font-size: 21rpx; line-height: 1.6; }
.custom-card__input-row { display: flex; gap: 12rpx; margin-top: 22rpx; }
.custom-card__input-row input { flex: 1; min-width: 0; height: 76rpx; padding: 0 20rpx; color: var(--ink); background: #fff2ed; border-radius: 20rpx 8rpx 20rpx 8rpx; font-size: 24rpx; }
.custom-card__input-row button { width: 120rpx; height: 76rpx; margin: 0; color: #fff; background: var(--ink); border-radius: 38rpx 10rpx 38rpx 10rpx; font-size: 22rpx; line-height: 76rpx; }
.custom-tags { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 18rpx; }
.custom-tags button { width: auto; height: 54rpx; margin: 0; padding: 0 17rpx; color: #91404e; background: #ffe5df; border-radius: 27rpx; font-size: 21rpx; line-height: 54rpx; }
.custom-tags text { margin-left: 5rpx; color: #c8838d; }

.submit-spacer { height: 150rpx; }
.submit-bar { position: fixed; z-index: 10; right: 22rpx; bottom: calc(18rpx + env(safe-area-inset-bottom)); left: 22rpx; display: flex; align-items: center; min-height: 98rpx; padding: 12rpx 14rpx 12rpx 24rpx; background: rgba(84, 43, 53, 0.94); border: 2rpx solid rgba(255, 255, 255, 0.2); border-radius: 49rpx 16rpx 49rpx 16rpx; box-shadow: 0 22rpx 46rpx rgba(84, 43, 53, 0.3); }
.submit-bar__count { display: flex; align-items: baseline; gap: 7rpx; flex: 1; color: rgba(255, 250, 246, 0.72); font-size: 20rpx; }
.submit-bar__number { color: #fff; font-size: 38rpx; font-weight: 900; }
.submit-bar button { width: 250rpx; height: 74rpx; margin: 0; color: #61333d; background: #fff8ef; border-radius: 37rpx 10rpx 37rpx 10rpx; font-size: 25rpx; font-weight: 900; line-height: 74rpx; }

.result-card { margin-bottom: 50rpx; padding: 52rpx 34rpx 42rpx; border-radius: 40rpx 14rpx 40rpx 14rpx; }
.result-card__seal { width: 112rpx; margin: 0 auto; padding: 10rpx 0; color: var(--red-dark); border: 3rpx solid rgba(185, 68, 91, 0.35); border-radius: 50%; font-size: 21rpx; font-weight: 900; letter-spacing: 2rpx; text-align: center; transform: rotate(-5deg); }
.result-card__title { display: block; margin-top: 26rpx; color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 46rpx; font-weight: 900; text-align: center; }
.result-card__name { display: block; margin-top: 10rpx; color: #98747b; font-size: 22rpx; text-align: center; }
.result-list { display: flex; flex-direction: column; gap: 12rpx; margin-top: 30rpx; }
.result-list--custom { margin-top: 12rpx; }
.result-item { display: flex; align-items: center; padding: 18rpx 20rpx; background: #fff3ee; border-radius: 22rpx 8rpx 22rpx 8rpx; }
.result-item__mark { display: flex; align-items: center; justify-content: center; width: 42rpx; height: 42rpx; margin-right: 15rpx; color: #fff; background: var(--red-dark); border-radius: 50%; font-size: 20rpx; }
.result-item__name,
.result-item__cook { display: block; }
.result-item__name { color: var(--ink); font-size: 25rpx; font-weight: 800; }
.result-item__cook { margin-top: 5rpx; color: #a08086; font-size: 18rpx; }
.result-card__edit { height: 78rpx; margin: 36rpx 0 0; color: #fff; background: var(--ink); border-radius: 39rpx 12rpx 39rpx 12rpx; font-size: 24rpx; font-weight: 800; line-height: 78rpx; }
.result-card__note { display: block; margin-top: 30rpx; color: #a58288; font-size: 20rpx; line-height: 1.6; text-align: center; }
</style>
