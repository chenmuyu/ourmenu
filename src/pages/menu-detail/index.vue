<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { accessState, loadAccess } from '../../access/session.js'
import SteamPlate from '../../components/SteamPlate.vue'
import { getMenuThumbnail } from '../../domain/menu.js'
import { repository } from '../../repositories/index.js'

const menuId = ref('')
const menu = ref(null)
const kitchen = ref({ members: [] })
const loading = ref(true)
const errorMessage = ref('')

const cook = computed(() => kitchen.value.members.find((member) => member.id === menu.value?.cookId))
const allImages = computed(() => [menu.value?.coverUrl, ...(menu.value?.imageUrls || [])].filter(Boolean))
const heroImage = computed(() => getMenuThumbnail(menu.value || {}))
const galleryImages = computed(() => (menu.value?.coverUrl ? menu.value?.imageUrls || [] : (menu.value?.imageUrls || []).slice(1)))
const group = computed(() => kitchen.value.groups?.find((item) => item.id === menu.value?.groupId))
const tags = computed(() => kitchen.value.tags?.filter((item) => menu.value?.tagIds?.includes(item.id)) || [])
const isFamily = computed(() => accessState.role === 'family')

async function loadDetail() {
  if (!menuId.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role === 'unbound') {
      uni.reLaunch({ url: '/pages/entry/index' })
      return
    }
    const [nextMenu, nextKitchen] = await Promise.all([repository.getMenu(menuId.value), repository.getKitchen()])
    menu.value = nextMenu
    kitchen.value = nextKitchen
    if (!nextMenu) errorMessage.value = '这道菜已经不存在了'
  } catch (error) {
    errorMessage.value = error?.message || '详情加载失败'
  } finally {
    loading.value = false
  }
}

function previewImage(current) {
  uni.previewImage({ current, urls: allImages.value })
}

function editMenu() {
  if (!isFamily.value) return
  uni.navigateTo({ url: `/pages/menu-edit/index?id=${encodeURIComponent(menuId.value)}` })
}

onLoad((options) => {
  menuId.value = decodeURIComponent(options.id || '')
})
onShow(loadDetail)
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="page-state">正在打开菜单…</view>
    <view v-else-if="errorMessage" class="page-state page-state--error" @tap="loadDetail">
      <text>{{ errorMessage }}</text>
      <text class="page-state__hint">点此重试</text>
    </view>

    <template v-else-if="menu">
      <view class="cover-wrap" :class="{ 'cover-wrap--empty': !heroImage }" @tap="heroImage && previewImage(heroImage)">
        <image v-if="heroImage" class="cover-image" :src="heroImage" mode="aspectFill" />
        <view v-else class="cover-placeholder"><SteamPlate /></view>
        <view class="cover-wrap__shade" />
        <view class="cover-wrap__caption">
          <text class="cover-wrap__eyebrow">TODAY'S DISH</text>
          <text class="cover-wrap__title">{{ menu.name }}</text>
        </view>
      </view>

      <view class="detail-paper">
        <view class="detail-meta">
          <view class="cook-chip">
            <image v-if="cook?.avatarUrl" class="cook-chip__avatar" :src="cook.avatarUrl" mode="aspectFill" />
            <view v-else class="cook-chip__avatar cook-chip__avatar--fallback">{{ cook?.name?.slice(0, 1) }}</view>
            <view>
              <text class="detail-label">掌勺人</text>
              <text class="detail-value">{{ cook?.name }}</text>
            </view>
          </view>
          <view class="date-block">
            <text class="detail-label">做菜日期</text>
            <text class="detail-value">{{ menu.cookedAt }}</text>
          </view>
        </view>

        <view v-if="group || tags.length" class="taxonomy-row">
          <text v-if="group" class="taxonomy-chip taxonomy-chip--group">{{ group.name }}</text>
          <text v-for="tag in tags" :key="tag.id" class="taxonomy-chip">{{ tag.name }}</text>
        </view>

        <view v-if="menu.note" class="note-card">
          <text class="section-title">这次记下</text>
          <text class="note-card__text">{{ menu.note }}</text>
        </view>

        <view v-if="galleryImages.length" class="gallery-section">
          <text class="section-title">更多照片</text>
          <view class="gallery-grid">
            <image
              v-for="imageUrl in galleryImages"
              :key="imageUrl"
              class="gallery-grid__image"
              :src="imageUrl"
              mode="aspectFill"
              @tap="previewImage(imageUrl)"
            />
          </view>
        </view>

        <button v-if="isFamily" class="edit-button" @tap="editMenu">编辑这道菜</button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  background: linear-gradient(150deg, #fff9f5, #ffe4df);
}

.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  color: var(--muted);
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 32rpx;
}

.page-state--error {
  color: var(--red-dark);
}

.page-state__hint {
  margin-top: 18rpx;
  color: var(--muted);
  font-size: 24rpx;
}

.cover-wrap {
  position: relative;
  height: 620rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-wrap--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #fff9f5, #ffdcd5);
}

.cover-placeholder {
  width: 210rpx;
  height: 210rpx;
  padding: 42rpx;
  background: rgba(255, 255, 255, 0.62);
  border: 3rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 50%;
  box-shadow: 0 24rpx 44rpx rgba(185, 68, 91, 0.15);
}

.cover-wrap__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(32, 24, 18, 0.78) 100%);
}

.cover-wrap__caption {
  position: absolute;
  right: 44rpx;
  bottom: 58rpx;
  left: 44rpx;
  color: #fffaf0;
}

.cover-wrap__eyebrow,
.cover-wrap__title {
  display: block;
}

.cover-wrap__eyebrow {
  margin-bottom: 14rpx;
  color: #e7c379;
  font-family: Georgia, serif;
  font-size: 19rpx;
  letter-spacing: 5rpx;
}

.cover-wrap__title {
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 60rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
}

.detail-paper {
  position: relative;
  z-index: 2;
  margin: -26rpx 24rpx 0;
  padding: 44rpx 38rpx;
  background: var(--paper);
  border-radius: 28rpx;
  box-shadow: 0 18rpx 46rpx var(--shadow);
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 34rpx;
  border-bottom: 2rpx solid var(--line);
}

.taxonomy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 30rpx;
}

.taxonomy-chip {
  padding: 12rpx 20rpx;
  color: var(--red-dark);
  background: #fff0ec;
  border-radius: 25rpx 9rpx 25rpx 9rpx;
  font-size: 21rpx;
}

.taxonomy-chip--group {
  color: #fff;
  background: var(--ink);
}

.cook-chip {
  display: flex;
  align-items: center;
}

.cook-chip__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  margin-right: 18rpx;
  border-radius: 50%;
}

.cook-chip__avatar--fallback {
  color: #fffaf0;
  background: var(--red);
  font-size: 30rpx;
  font-weight: 700;
}

.detail-label,
.detail-value {
  display: block;
}

.detail-label {
  margin-bottom: 8rpx;
  color: var(--muted);
  font-size: 20rpx;
  letter-spacing: 2rpx;
}

.detail-value {
  font-size: 28rpx;
  font-weight: 600;
}

.date-block {
  text-align: right;
}

.section-title {
  display: block;
  margin-bottom: 22rpx;
  color: var(--red);
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.note-card,
.gallery-section {
  margin-top: 42rpx;
}

.note-card__text {
  color: #534a40;
  font-size: 29rpx;
  line-height: 1.9;
  white-space: pre-wrap;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.gallery-grid__image {
  width: 100%;
  height: 260rpx;
  border-radius: 12rpx;
}

.edit-button {
  height: 88rpx;
  margin-top: 52rpx;
  color: #fffaf0;
  background: var(--ink);
  border-radius: 10rpx;
  font-size: 27rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  line-height: 88rpx;
}
</style>
