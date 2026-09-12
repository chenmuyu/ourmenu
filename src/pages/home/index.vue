<script setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { accessState, loadAccess } from '../../access/session.js'
import BottomNav from '../../components/BottomNav.vue'
import CookTabs from '../../components/CookTabs.vue'
import MenuBook from '../../components/MenuBook.vue'
import { getMenusByCook } from '../../domain/menu.js'
import { createHomeSharePayload } from '../../domain/share.js'
import { repository, repositoryMode } from '../../repositories/index.js'

const statusBarHeight = uni.getWindowInfo?.().statusBarHeight || 24
const kitchen = ref({ name: '粤湘情', backgroundUrl: '', members: [], groups: [] })
const menus = ref([])
const selectedCookId = ref('')
const selectedGroupId = ref('')
const loading = ref(true)
const errorMessage = ref('')

const isFamily = computed(() => accessState.role === 'family')
const activeGroups = computed(() => (kitchen.value.groups || []).filter((item) => item.active !== false))
const currentCook = computed(() => kitchen.value.members.find((member) => member.id === selectedCookId.value))
const currentGroup = computed(() => activeGroups.value.find((group) => group.id === selectedGroupId.value))
const currentMenus = computed(() => getMenusByCook(menus.value, selectedCookId.value, selectedGroupId.value))
const emptyCopy = computed(() =>
  currentGroup.value ? `等一顿香喷喷的${currentGroup.value.name}吧` : '记下第一道菜吧',
)

async function loadPage() {
  loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role === 'unbound') {
      uni.reLaunch({ url: '/pages/entry/index' })
      return
    }

    const [nextKitchen, nextMenus] = await Promise.all([repository.getKitchen(), repository.listMenus()])
    kitchen.value = nextKitchen
    menus.value = nextMenus
    if (!nextKitchen.members.some((member) => member.id === selectedCookId.value)) {
      selectedCookId.value = nextKitchen.members[0]?.id || ''
    }
    if (selectedGroupId.value && !nextKitchen.groups.some((group) => group.id === selectedGroupId.value && group.active)) {
      selectedGroupId.value = ''
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
  if (!isFamily.value) return
  uni.navigateTo({ url: `/pages/menu-edit/index?cookId=${encodeURIComponent(selectedCookId.value)}` })
}

function openSettings() {
  if (!isFamily.value) return
  uni.navigateTo({ url: '/pages/settings/index' })
}

onShow(loadPage)
onShareAppMessage(() => createHomeSharePayload('粤湘情'))
</script>

<template>
  <view class="home-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <image v-if="kitchen.backgroundUrl" class="page-background" :src="kitchen.backgroundUrl" mode="aspectFill" />
    <view class="page-wash" />
    <view class="love-bubble love-bubble--one" />
    <view class="love-bubble love-bubble--two">♡</view>

    <view class="home-header">
      <view class="hero-title" aria-label="粤湘情">
        <text class="hero-title__yue">粤</text>
        <text class="hero-title__xiang">湘情</text>
        <view class="hero-title__stroke" />
      </view>
      <text class="home-header__copy">一半粤味，一半湘情，合起来就是我们的日常。</text>

      <button v-if="isFamily" class="settings-button" aria-label="打开小家设置" @tap="openSettings">✦</button>
      <view v-else class="guest-badge">客人浏览</view>
    </view>

    <view v-if="errorMessage" class="error-strip" @tap="loadPage">
      <text>{{ errorMessage }}，点此重试</text>
    </view>

    <scroll-view class="group-rail" scroll-x :show-scrollbar="false">
      <view class="group-rail__inner">
        <button class="group-chip" :class="{ 'group-chip--active': !selectedGroupId }" @tap="selectedGroupId = ''">全部</button>
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

    <view class="book-shell">
      <CookTabs :members="kitchen.members" :selected-id="selectedCookId" @select="selectedCookId = $event" />
      <MenuBook
        :menus="currentMenus"
        :cook-name="currentCook?.name"
        :loading="loading"
        :empty-copy="emptyCopy"
        @open="openMenu"
      />
    </view>

    <view v-if="repositoryMode === 'local'" class="mode-note">本地体验模式</view>
    <button v-if="isFamily" class="add-button" aria-label="新增菜单" @tap="createMenu">
      <text class="add-button__plus">＋</text>
      <text class="add-button__label">记一道菜</text>
    </button>
    <BottomNav active="kitchen" />
  </view>
</template>

<style scoped lang="scss">
.home-page {
  position: relative;
  min-height: 100vh;
  padding-bottom: calc(190rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 8%, rgba(255, 193, 181, 0.54), transparent 28%),
    linear-gradient(150deg, #fffdf9 0%, #fff1ed 54%, #ffd9d3 100%);
}

.page-background,
.page-wash {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
}

.page-background { opacity: 0.46; }

.page-wash {
  background: linear-gradient(180deg, rgba(255, 249, 245, 0.58), rgba(255, 241, 237, 0.87) 48%, #fff3ee 100%);
}

.home-header {
  position: relative;
  z-index: 2;
  min-height: 300rpx;
  padding: 30rpx 36rpx 20rpx;
}

.hero-title {
  position: relative;
  width: 430rpx;
  height: 190rpx;
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-weight: 900;
}

.hero-title__yue,
.hero-title__xiang {
  position: absolute;
  display: block;
  line-height: 1;
}

.hero-title__yue {
  top: -10rpx;
  left: 6rpx;
  color: var(--red-dark);
  font-size: 174rpx;
  transform: rotate(-8deg);
  text-shadow: 8rpx 10rpx 0 rgba(232, 201, 140, 0.55);
}

.hero-title__xiang {
  right: 0;
  bottom: 4rpx;
  color: var(--ink);
  font-size: 108rpx;
  letter-spacing: -8rpx;
  transform: rotate(3deg);
}

.hero-title__stroke {
  position: absolute;
  right: 8rpx;
  bottom: -5rpx;
  width: 290rpx;
  height: 20rpx;
  border-top: 7rpx solid var(--red);
  border-radius: 50%;
  transform: rotate(-3deg);
}

.home-header__copy {
  display: block;
  max-width: 540rpx;
  margin-top: 4rpx;
  color: #815864;
  font-size: 23rpx;
  letter-spacing: 2rpx;
  line-height: 1.7;
}

.settings-button,
.guest-badge {
  position: absolute;
  top: 44rpx;
  right: 34rpx;
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  margin: 0;
  padding: 0;
  color: var(--red-dark);
  background: rgba(255, 253, 249, 0.82);
  border: 2rpx solid rgba(255, 255, 255, 0.88);
  border-radius: 50%;
  box-shadow: 0 12rpx 28rpx rgba(97, 39, 56, 0.15);
  font-size: 31rpx;
  line-height: 1;
}

.guest-badge {
  padding: 14rpx 20rpx;
  color: #8e6871;
  background: rgba(255, 253, 249, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 28rpx;
  font-size: 20rpx;
  letter-spacing: 2rpx;
}

.group-rail {
  position: relative;
  z-index: 3;
  width: 100%;
  margin: 2rpx 0 18rpx;
  white-space: nowrap;
}

.group-rail__inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 8rpx 28rpx;
}

.group-chip {
  width: auto;
  height: 64rpx;
  margin: 0;
  padding: 0 28rpx;
  color: #875f69;
  background: rgba(255, 253, 249, 0.76);
  border: 2rpx solid rgba(185, 68, 91, 0.12);
  border-radius: 32rpx 12rpx 32rpx 12rpx;
  font-size: 23rpx;
  line-height: 62rpx;
}

.group-chip--active {
  color: #fff;
  background: var(--ink);
  border-color: var(--ink);
  box-shadow: 0 10rpx 20rpx rgba(84, 43, 53, 0.2);
}

.book-shell,
.error-strip,
.mode-note {
  position: relative;
  z-index: 2;
}

.error-strip {
  margin: 8rpx 36rpx 20rpx;
  padding: 18rpx 24rpx;
  color: var(--red-dark);
  background: rgba(255, 253, 249, 0.86);
  border: 2rpx solid rgba(185, 68, 91, 0.18);
  border-radius: 18rpx;
  font-size: 24rpx;
  text-align: center;
}

.mode-note {
  margin-top: 34rpx;
  color: rgba(84, 43, 53, 0.42);
  font-size: 20rpx;
  letter-spacing: 3rpx;
  text-align: center;
}

.add-button {
  position: fixed;
  z-index: 21;
  right: 42rpx;
  bottom: calc(142rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  width: auto;
  height: 86rpx;
  margin: 0;
  padding: 0 28rpx 0 18rpx;
  color: #fff;
  background: linear-gradient(110deg, var(--red-dark), var(--red));
  border-radius: 43rpx 14rpx 43rpx 14rpx;
  box-shadow: 0 16rpx 30rpx rgba(185, 68, 91, 0.3);
  line-height: 1;
}

.add-button__plus { margin-right: 8rpx; font-size: 44rpx; font-weight: 300; }
.add-button__label { font-size: 25rpx; font-weight: 700; letter-spacing: 2rpx; }

.love-bubble {
  position: absolute;
  z-index: 1;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: home-float 8s ease-in-out infinite;
}

.love-bubble--one { top: 240rpx; right: -30rpx; width: 120rpx; height: 120rpx; background: rgba(255, 193, 181, 0.2); }
.love-bubble--two { top: 540rpx; left: 18rpx; display: flex; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; color: var(--red); background: rgba(255, 255, 255, 0.25); font-size: 24rpx; animation-delay: -3s; }

@keyframes home-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-26rpx); }
}
</style>
