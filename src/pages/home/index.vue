<script setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import CookTabs from '../../components/CookTabs.vue'
import MenuBook from '../../components/MenuBook.vue'
import { getMenusByCook } from '../../domain/menu.js'
import { createHomeSharePayload } from '../../domain/share.js'
import { repository, repositoryMode } from '../../repositories/index.js'

const statusBarHeight = uni.getWindowInfo?.().statusBarHeight || 24
const kitchen = ref({ name: '两人菜单', members: [] })
const menus = ref([])
const selectedCookId = ref('')
const loading = ref(true)
const errorMessage = ref('')

const currentCook = computed(() => kitchen.value.members.find((member) => member.id === selectedCookId.value))
const currentMenus = computed(() => getMenusByCook(menus.value, selectedCookId.value))

async function loadPage() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [nextKitchen, nextMenus] = await Promise.all([repository.getKitchen(), repository.listMenus()])
    kitchen.value = nextKitchen
    menus.value = nextMenus
    if (!nextKitchen.members.some((member) => member.id === selectedCookId.value)) {
      selectedCookId.value = nextKitchen.members[0]?.id || ''
    }
  } catch (error) {
    errorMessage.value = error?.message || '菜单加载失败'
  } finally {
    loading.value = false
  }
}

function openMenu(id) {
  uni.navigateTo({ url: `/pages/menu-detail/index?id=${encodeURIComponent(id)}` })
}

function createMenu() {
  uni.navigateTo({ url: `/pages/menu-edit/index?cookId=${encodeURIComponent(selectedCookId.value)}` })
}

function openSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function confirmDelete(id) {
  const menu = menus.value.find((item) => item.id === id)
  if (!menu) return
  uni.showModal({
    title: `删除“${menu.name}”？`,
    content: '删除后两个人都将看不到这条记录，且无法恢复。',
    confirmText: '删除',
    confirmColor: '#b94134',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await repository.deleteMenu(id)
        menus.value = menus.value.filter((item) => item.id !== id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error?.message || '删除失败，请重试', icon: 'none' })
      }
    },
  })
}

onShow(loadPage)
onShareAppMessage(() => createHomeSharePayload(kitchen.value.name))
</script>

<template>
  <view class="home-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="home-header">
      <view>
        <text class="home-header__eyebrow">TWO-PERSON KITCHEN</text>
        <text class="home-header__title">{{ kitchen.name }}</text>
      </view>
      <button class="settings-button" aria-label="设置两人资料" @tap="openSettings">✎</button>
    </view>

    <view v-if="errorMessage" class="error-strip" @tap="loadPage">
      <text>{{ errorMessage }}，点此重试</text>
    </view>

    <view class="book-shell">
      <CookTabs :members="kitchen.members" :selected-id="selectedCookId" @select="selectedCookId = $event" />
      <MenuBook
        :menus="currentMenus"
        :cook-name="currentCook?.name"
        :loading="loading"
        @open="openMenu"
        @delete="confirmDelete"
      />
    </view>

    <view v-if="repositoryMode === 'local'" class="mode-note">本地体验模式</view>
    <button class="add-button" aria-label="新增菜单" @tap="createMenu">
      <text class="add-button__plus">＋</text>
      <text class="add-button__label">记一道菜</text>
    </button>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  position: relative;
  min-height: 100vh;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 8%, rgba(255, 255, 255, 0.68), transparent 30%),
    linear-gradient(145deg, #f2eadb 0%, #e8dcc7 100%);
}

.home-page::before {
  position: absolute;
  top: 0;
  right: -160rpx;
  width: 480rpx;
  height: 480rpx;
  border: 2rpx solid rgba(185, 65, 52, 0.08);
  border-radius: 50%;
  content: '';
}

.home-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 36rpx 22rpx;
}

.home-header__eyebrow,
.home-header__title {
  display: block;
}

.home-header__eyebrow {
  margin-bottom: 10rpx;
  color: var(--red);
  font-family: Georgia, serif;
  font-size: 18rpx;
  letter-spacing: 5rpx;
}

.home-header__title {
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 52rpx;
  font-weight: 700;
  letter-spacing: 8rpx;
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0 0 8rpx;
  color: var(--ink);
  background: rgba(255, 250, 240, 0.62);
  border: 2rpx solid rgba(74, 55, 40, 0.18);
  border-radius: 50%;
  font-family: Georgia, serif;
  font-size: 42rpx;
  line-height: 1;
}

.book-shell {
  position: relative;
  z-index: 2;
}

.error-strip {
  margin: 8rpx 36rpx;
  padding: 18rpx 24rpx;
  color: #8f2f27;
  background: rgba(255, 250, 240, 0.78);
  border: 2rpx solid rgba(143, 47, 39, 0.2);
  border-radius: 12rpx;
  font-size: 24rpx;
  text-align: center;
}

.mode-note {
  margin-top: 34rpx;
  color: rgba(48, 42, 36, 0.38);
  font-size: 20rpx;
  letter-spacing: 3rpx;
  text-align: center;
}

.add-button {
  position: fixed;
  z-index: 9;
  right: 36rpx;
  bottom: calc(36rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  width: auto;
  height: 92rpx;
  margin: 0;
  padding: 0 30rpx 0 18rpx;
  color: #fffaf0;
  background: var(--red);
  border: 2rpx solid var(--red-dark);
  border-radius: 46rpx;
  box-shadow: 0 16rpx 32rpx rgba(143, 47, 39, 0.3);
  line-height: 1;
}

.add-button:active {
  transform: translateY(2rpx);
  box-shadow: 0 10rpx 20rpx rgba(143, 47, 39, 0.24);
}

.add-button__plus {
  margin-right: 8rpx;
  font-size: 48rpx;
  font-weight: 300;
}

.add-button__label {
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}
</style>
