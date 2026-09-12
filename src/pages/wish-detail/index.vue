<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { accessState, loadAccess } from '../../access/session.js'
import SteamPlate from '../../components/SteamPlate.vue'
import { getWishThumbnail, WISH_STATUSES } from '../../domain/wish.js'
import { repository } from '../../repositories/index.js'

const wishId = ref('')
const wish = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const isFamily = computed(() => accessState.role === 'family')
const statusName = computed(() => WISH_STATUSES.find((item) => item.id === wish.value?.status)?.name || '')
const heroImage = computed(() => getWishThumbnail(wish.value || {}))
const allImages = computed(() => [wish.value?.coverUrl, ...(wish.value?.imageUrls || [])].filter(Boolean))
const galleryImages = computed(() => (wish.value?.coverUrl ? wish.value?.imageUrls || [] : (wish.value?.imageUrls || []).slice(1)))

async function loadDetail() {
  if (!wishId.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role === 'unbound') {
      uni.reLaunch({ url: '/pages/entry/index' })
      return
    }
    wish.value = await repository.getWish(wishId.value)
    if (!wish.value) errorMessage.value = '这份心动已经不存在了'
  } catch (error) {
    errorMessage.value = error?.message || '详情加载失败'
  } finally {
    loading.value = false
  }
}

function previewImage(current) {
  if (current) uni.previewImage({ current, urls: allImages.value })
}

function editWish() {
  if (isFamily.value) uni.navigateTo({ url: `/pages/wish-edit/index?id=${encodeURIComponent(wishId.value)}` })
}

onLoad((options) => {
  wishId.value = decodeURIComponent(options.id || '')
})
onShow(loadDetail)
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="page-state">正在打开这份心动…</view>
    <view v-else-if="errorMessage" class="page-state page-state--error" @tap="loadDetail">{{ errorMessage }}，点此重试</view>

    <template v-else-if="wish">
      <view class="hero" :class="{ 'hero--empty': !heroImage }" @tap="previewImage(heroImage)">
        <image v-if="heroImage" class="hero__image" :src="heroImage" mode="aspectFill" />
        <view v-else class="hero__placeholder"><SteamPlate /></view>
        <view class="hero__shade" />
        <view class="hero__caption">
          <text class="hero__status">{{ statusName }}</text>
          <text class="hero__title">{{ wish.name }}</text>
        </view>
      </view>

      <view class="detail-card">
        <view v-if="wish.source || wish.tastedAt" class="meta-row">
          <view v-if="wish.source" class="meta-item"><text class="meta-label">店名或来源</text><text class="meta-value">{{ wish.source }}</text></view>
          <view v-if="wish.tastedAt" class="meta-item meta-item--right"><text class="meta-label">记住这一天</text><text class="meta-value">{{ wish.tastedAt }}</text></view>
        </view>

        <view v-if="wish.note" class="note-card">
          <text class="section-title">为什么心动</text>
          <text class="note-card__text">{{ wish.note }}</text>
        </view>

        <view v-if="galleryImages.length" class="gallery-section">
          <text class="section-title">更多照片</text>
          <view class="gallery-grid">
            <image v-for="imageUrl in galleryImages" :key="imageUrl" class="gallery-grid__image" :src="imageUrl" mode="aspectFill" @tap="previewImage(imageUrl)" />
          </view>
        </view>

        <button v-if="isFamily" class="edit-button" @tap="editWish">编辑这份心动</button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.detail-page { min-height: 100vh; padding-bottom: calc(50rpx + env(safe-area-inset-bottom)); background: linear-gradient(150deg,#fff9f5,#ffdfd9); }
.page-state { display: flex; align-items: center; justify-content: center; min-height: 70vh; color: var(--muted); font-size: 27rpx; }
.page-state--error { color: var(--red-dark); }
.hero { position: relative; height: 620rpx; overflow: hidden; }
.hero__image { width: 100%; height: 100%; }
.hero--empty { display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg,#fff9f5,#ffd7d1); }
.hero__placeholder { width: 220rpx; height: 220rpx; padding: 45rpx; background: rgba(255,255,255,.6); border: 3rpx solid rgba(255,255,255,.88); border-radius: 50%; }
.hero__shade { position: absolute; inset: 0; background: linear-gradient(180deg,transparent 38%,rgba(84,43,53,.8)); }
.hero__caption { position: absolute; right: 40rpx; bottom: 56rpx; left: 40rpx; color: #fff; }
.hero__status { display: inline-block; margin-bottom: 18rpx; padding: 10rpx 20rpx; color: var(--ink); background: var(--gold); border-radius: 22rpx 8rpx 22rpx 8rpx; font-size: 20rpx; font-weight: 700; }
.hero__title { display: block; font-family: 'Kaiti SC','STKaiti',serif; font-size: 62rpx; font-weight: 900; letter-spacing: 3rpx; }
.detail-card { position: relative; z-index: 2; margin: -28rpx 24rpx 0; padding: 42rpx 36rpx; background: rgba(255,253,249,.96); border-radius: 38rpx 14rpx 38rpx 14rpx; box-shadow: 0 20rpx 48rpx var(--shadow); }
.meta-row { display: flex; justify-content: space-between; gap: 20rpx; padding-bottom: 32rpx; border-bottom: 2rpx solid var(--line); }
.meta-item { flex: 1; }.meta-item--right { text-align: right; }
.meta-label,.meta-value { display: block; }.meta-label { margin-bottom: 9rpx; color: var(--muted); font-size: 20rpx; }.meta-value { font-size: 27rpx; font-weight: 700; }
.note-card,.gallery-section { margin-top: 40rpx; }
.section-title { display: block; margin-bottom: 20rpx; color: var(--red-dark); font-family: 'Kaiti SC','STKaiti',serif; font-size: 30rpx; font-weight: 900; letter-spacing: 3rpx; }
.note-card__text { color: #704b55; font-size: 28rpx; line-height: 1.9; white-space: pre-wrap; }
.gallery-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14rpx; }.gallery-grid__image { width: 100%; height: 260rpx; border-radius: 24rpx 8rpx 24rpx 8rpx; }
.edit-button { height: 88rpx; margin-top: 48rpx; color: #fff; background: var(--ink); border-radius: 44rpx 14rpx 44rpx 14rpx; font-size: 25rpx; font-weight: 700; letter-spacing: 3rpx; line-height: 88rpx; }
</style>
