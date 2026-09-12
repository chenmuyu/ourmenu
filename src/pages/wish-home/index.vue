<script setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { accessState, loadAccess } from '../../access/session.js'
import SteamPlate from '../../components/SteamPlate.vue'
import { getWishThumbnail, sortWishes, WISH_STATUSES } from '../../domain/wish.js'
import { repository } from '../../repositories/index.js'

const statusBarHeight = uni.getWindowInfo?.().statusBarHeight || 24
const wishes = ref([])
const selectedStatus = ref('want')
const loading = ref(true)
const hasLoaded = ref(false)
const errorMessage = ref('')

const isFamily = computed(() => accessState.role === 'family')
const currentWishes = computed(() => sortWishes(wishes.value.filter((wish) => wish.status === selectedStatus.value)))
const currentStatus = computed(() => WISH_STATUSES.find((status) => status.id === selectedStatus.value))

async function loadPage() {
  if (!hasLoaded.value) loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role === 'unbound') {
      uni.reLaunch({ url: '/pages/entry/index' })
      return
    }
    wishes.value = await repository.listWishes()
  } catch (error) {
    errorMessage.value = error?.message || '想吃清单加载失败'
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

function openWish(id) {
  uni.navigateTo({ url: `/pages/wish-detail/index?id=${encodeURIComponent(id)}` })
}

function createWish() {
  if (!isFamily.value) return
  uni.navigateTo({ url: `/pages/wish-edit/index?status=${selectedStatus.value}` })
}

onShow(loadPage)
onShareAppMessage(() => ({ title: '老公我要吃这个！', path: '/pages/entry/index' }))
</script>

<template>
  <view class="wish-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="wish-bubble wish-bubble--one">♡</view>
    <view class="wish-bubble wish-bubble--two" />

    <view class="wish-hero">
      <text class="wish-hero__husband">老公</text>
      <text class="wish-hero__want">我要吃</text>
      <text class="wish-hero__this">这个！</text>
      <text class="wish-hero__copy">把心动的一口，先替未来收藏起来。</text>
      <view v-if="!isFamily" class="guest-badge">客人浏览</view>
    </view>

    <view v-if="errorMessage" class="error-strip" @tap="loadPage">{{ errorMessage }}，点此重试</view>

    <view class="status-switch">
      <button
        v-for="status in WISH_STATUSES"
        :key="status.id"
        class="status-switch__item"
        :class="{ 'status-switch__item--active': selectedStatus === status.id }"
        @tap="selectedStatus = status.id"
      >
        {{ status.name }}
      </button>
    </view>

    <view class="wish-list">
      <view v-if="loading" class="wish-state">正在翻心愿卡片…</view>
      <view v-else-if="currentWishes.length === 0" class="wish-state">
        <view class="wish-state__plate"><SteamPlate /></view>
        <text class="wish-state__title">{{ currentStatus?.name }}的清单还空着</text>
        <text class="wish-state__copy">遇见心动的味道，就把它放进来吧。</text>
      </view>
      <button v-for="(wish, index) in currentWishes" v-else :key="wish.id" class="wish-card" @tap="openWish(wish.id)">
        <view class="wish-card__number">{{ String(index + 1).padStart(2, '0') }}</view>
        <view class="wish-card__copy">
          <text class="wish-card__name">{{ wish.name }}</text>
          <text v-if="wish.source" class="wish-card__source">{{ wish.source }}</text>
          <text v-else class="wish-card__source">留给下一次心动</text>
        </view>
        <image v-if="getWishThumbnail(wish)" class="wish-card__thumb" :src="getWishThumbnail(wish)" mode="aspectFill" />
        <view v-else class="wish-card__thumb wish-card__thumb--empty"><SteamPlate /></view>
      </button>
    </view>

    <button v-if="isFamily" class="add-button" @tap="createWish">
      <text class="add-button__plus">＋</text>
      <text>记下心动</text>
    </button>
  </view>
</template>

<style scoped lang="scss">
.wish-page {
  position: relative;
  min-height: 100vh;
  padding-bottom: calc(88rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background: linear-gradient(155deg, #fffdfb, #ffe8e2 58%, #ffd5d2);
}

.wish-hero {
  position: relative;
  z-index: 2;
  height: 430rpx;
  padding: 24rpx 34rpx 0;
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-weight: 900;
}

.wish-hero text { position: absolute; display: block; line-height: 1; }
.wish-hero__husband { top: 42rpx; left: 44rpx; color: var(--ink); font-size: 76rpx; transform: rotate(-9deg); }
.wish-hero__want { top: 112rpx; left: 28rpx; color: var(--red-dark); font-size: 150rpx; letter-spacing: -12rpx; text-shadow: 9rpx 12rpx 0 rgba(232, 201, 140, 0.62); transform: rotate(-2deg); }
.wish-hero__this { top: 250rpx; right: 48rpx; color: #fff; font-size: 112rpx; letter-spacing: -7rpx; -webkit-text-stroke: 5rpx var(--red); text-shadow: 7rpx 8rpx 0 var(--ink); transform: rotate(7deg); }
.wish-hero__copy { right: 40rpx; bottom: 8rpx; color: #815864; font-family: sans-serif; font-size: 22rpx; font-weight: 400; letter-spacing: 2rpx; }

.guest-badge {
  position: absolute;
  top: 38rpx;
  right: 30rpx;
  padding: 13rpx 19rpx;
  color: #8e6871;
  background: rgba(255, 253, 249, 0.8);
  border-radius: 26rpx;
  font-family: sans-serif;
  font-size: 20rpx;
  font-weight: 400;
}

.status-switch {
  position: relative;
  z-index: 3;
  display: flex;
  margin: 10rpx 28rpx 28rpx;
  padding: 8rpx;
  background: rgba(255, 253, 249, 0.74);
  border: 2rpx solid rgba(255, 255, 255, 0.82);
  border-radius: 42rpx 15rpx 42rpx 15rpx;
  box-shadow: 0 14rpx 28rpx rgba(111, 50, 66, 0.11);
}

.status-switch__item {
  flex: 1;
  height: 70rpx;
  margin: 0;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border-radius: 35rpx 12rpx 35rpx 12rpx;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 70rpx;
}

.status-switch__item--active { color: #fff; background: var(--ink); box-shadow: 0 10rpx 20rpx rgba(84, 43, 53, 0.2); }

.wish-list { position: relative; z-index: 2; min-height: 500rpx; margin: 0 28rpx; }

.wish-card {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 128rpx;
  margin: 0 0 18rpx;
  padding: 18rpx 20rpx;
  color: var(--ink);
  background: rgba(255, 253, 249, 0.88);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 34rpx 12rpx 34rpx 12rpx;
  box-shadow: 0 15rpx 30rpx rgba(111, 50, 66, 0.1);
  text-align: left;
  line-height: 1.3;
}

.wish-card__number { width: 62rpx; color: var(--red); font-family: Georgia, serif; font-size: 20rpx; }
.wish-card__copy { flex: 1; min-width: 0; }
.wish-card__name { display: block; overflow: hidden; font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 34rpx; font-weight: 900; letter-spacing: 2rpx; text-overflow: ellipsis; white-space: nowrap; }
.wish-card__source { display: block; margin-top: 8rpx; overflow: hidden; color: var(--muted); font-size: 20rpx; text-overflow: ellipsis; white-space: nowrap; }
.wish-card__thumb { flex: 0 0 auto; width: 80rpx; height: 80rpx; margin-left: 16rpx; background: #fff0ec; border: 4rpx solid #fff; border-radius: 50%; box-shadow: 0 7rpx 15rpx rgba(111, 50, 66, 0.15); }
.wish-card__thumb--empty { overflow: hidden; }

.wish-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 480rpx; color: var(--muted); }
.wish-state__plate { width: 112rpx; height: 112rpx; margin-bottom: 25rpx; padding: 17rpx; background: rgba(255,255,255,.65); border-radius: 50%; }
.wish-state__title { color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 32rpx; font-weight: 900; }
.wish-state__copy { margin-top: 14rpx; font-size: 21rpx; }

.add-button {
  position: fixed;
  z-index: 21;
  right: 42rpx;
  bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  width: auto;
  height: 86rpx;
  margin: 0;
  padding: 0 27rpx 0 18rpx;
  color: #fff;
  background: linear-gradient(110deg, var(--red-dark), var(--red));
  border-radius: 43rpx 14rpx 43rpx 14rpx;
  box-shadow: 0 16rpx 30rpx rgba(185, 68, 91, 0.3);
  font-size: 24rpx;
  font-weight: 700;
}
.add-button__plus { margin-right: 7rpx; font-size: 43rpx; font-weight: 300; }

.error-strip { position: relative; z-index: 3; margin: 0 34rpx 20rpx; padding: 18rpx; color: var(--red-dark); background: rgba(255,255,255,.76); border-radius: 18rpx; font-size: 22rpx; text-align: center; }
.wish-bubble { position: absolute; z-index: 1; display: flex; align-items: center; justify-content: center; color: var(--red); border: 2rpx solid rgba(255,255,255,.8); border-radius: 50%; animation: wish-float 8s ease-in-out infinite; }
.wish-bubble--one { top: 190rpx; right: 24rpx; width: 70rpx; height: 70rpx; background: rgba(255,255,255,.2); font-size: 28rpx; }
.wish-bubble--two { top: 500rpx; left: -32rpx; width: 120rpx; height: 120rpx; background: rgba(255,193,181,.2); animation-delay: -3s; }
@keyframes wish-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-28rpx); } }
</style>
