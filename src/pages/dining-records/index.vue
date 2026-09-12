<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { repository } from '../../repositories/index.js'

const invites = ref([])
const loading = ref(true)
const errorMessage = ref('')

async function loadPage() {
  loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以查看点菜记录', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 300)
      return
    }
    invites.value = await repository.listDiningInvites()
  } catch (error) {
    errorMessage.value = error?.message || '点菜记录加载失败'
  } finally {
    loading.value = false
  }
}

function openInvite(id) {
  uni.navigateTo({ url: `/pages/dining-manage/index?id=${encodeURIComponent(id)}` })
}

function createInvite() {
  uni.navigateTo({ url: '/pages/dining-create/index' })
}

onShow(loadPage)
</script>

<template>
  <view class="records-page">
    <view class="records-heading">
      <text class="records-heading__eyebrow">OUR LITTLE RESTAURANT</text>
      <text class="records-heading__title">每一桌，都值得记住</text>
      <text class="records-heading__copy">从“今天吃什么”，到后来想起时还会笑的一顿饭。</text>
    </view>

    <view v-if="loading" class="page-state">正在翻阅点菜簿…</view>
    <view v-else-if="errorMessage" class="page-state page-state--error" @tap="loadPage">
      {{ errorMessage }}，点此重试
    </view>

    <view v-else-if="!invites.length" class="empty-card">
      <text class="empty-card__mark">♡</text>
      <text class="empty-card__title">点菜簿还是空的</text>
      <text class="empty-card__copy">发出第一张邀请，等喜欢的人来选菜。</text>
      <button class="empty-card__button" @tap="createInvite">欢迎点菜</button>
    </view>

    <view v-else class="record-list">
      <button v-for="invite in invites" :key="invite.id" class="record-card" @tap="openInvite(invite.id)">
        <view class="record-card__topline">
          <text class="record-card__date">{{ invite.diningDate }}</text>
          <text class="record-card__status" :class="{ 'record-card__status--closed': invite.status !== 'open' }">
            {{ invite.status === 'open' ? '正在点菜' : '已经开席' }}
          </text>
        </view>
        <text class="record-card__theme">{{ invite.theme }}</text>
        <view class="record-card__summary">
          <text>{{ invite.participantCount }} 人回应</text>
          <text class="record-card__dot">·</text>
          <text>共点 {{ invite.dishCount }} 道</text>
          <text class="record-card__arrow">›</text>
        </view>
      </button>
    </view>

    <button v-if="invites.length" class="floating-create" @tap="createInvite">＋ 新邀请</button>
  </view>
</template>

<style scoped lang="scss">
.records-page {
  min-height: 100vh;
  padding: 42rpx 26rpx calc(130rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 92% 4%, rgba(255, 193, 181, 0.4), transparent 26%),
    linear-gradient(160deg, #fffdf9 0%, #fff1ed 58%, #ffded8 100%);
}

.records-heading { padding: 14rpx 12rpx 36rpx; }
.records-heading__eyebrow,
.records-heading__title,
.records-heading__copy { display: block; }
.records-heading__eyebrow { color: #b67a58; font-size: 17rpx; font-weight: 800; letter-spacing: 4rpx; }
.records-heading__title { margin-top: 15rpx; color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 50rpx; font-weight: 900; }
.records-heading__copy { max-width: 570rpx; margin-top: 12rpx; color: #916b73; font-size: 22rpx; line-height: 1.7; }

.page-state,
.empty-card {
  margin-top: 28rpx;
  padding: 120rpx 30rpx;
  color: var(--muted);
  text-align: center;
}

.page-state--error { padding: 70rpx 30rpx; background: rgba(255, 253, 249, 0.84); border-radius: 28rpx; }

.empty-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  background: rgba(255, 253, 249, 0.86);
  border: 2rpx solid rgba(119, 63, 77, 0.1);
  border-radius: 38rpx 14rpx 38rpx 14rpx;
  box-shadow: 0 22rpx 56rpx rgba(111, 50, 66, 0.12);
}

.empty-card__mark { color: var(--red); font-size: 56rpx; }
.empty-card__title { margin-top: 18rpx; color: var(--ink); font-size: 32rpx; font-weight: 800; }
.empty-card__copy { margin-top: 12rpx; font-size: 22rpx; line-height: 1.6; }
.empty-card__button { width: 260rpx; height: 76rpx; margin: 34rpx 0 0; color: #fff; background: var(--ink); border-radius: 38rpx 12rpx 38rpx 12rpx; font-size: 24rpx; line-height: 76rpx; }

.record-list { display: flex; flex-direction: column; gap: 22rpx; }

.record-card {
  width: 100%;
  margin: 0;
  padding: 30rpx 30rpx 28rpx;
  color: var(--ink);
  background: rgba(255, 253, 249, 0.92);
  border: 2rpx solid rgba(119, 63, 77, 0.1);
  border-radius: 34rpx 12rpx 34rpx 12rpx;
  box-shadow: 0 16rpx 38rpx rgba(111, 50, 66, 0.12);
  line-height: 1.4;
  text-align: left;
}

.record-card__topline { display: flex; align-items: center; justify-content: space-between; }
.record-card__date { color: #a87456; font-size: 21rpx; font-weight: 800; letter-spacing: 2rpx; }
.record-card__status { padding: 8rpx 15rpx; color: #fff; background: var(--red-dark); border-radius: 18rpx; font-size: 18rpx; letter-spacing: 1rpx; }
.record-card__status--closed { color: #80656a; background: #f1e4df; }
.record-card__theme { display: block; margin-top: 22rpx; font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 40rpx; font-weight: 900; }
.record-card__summary { display: flex; align-items: center; margin-top: 22rpx; padding-top: 20rpx; color: #99737a; border-top: 2rpx solid rgba(119, 63, 77, 0.1); font-size: 21rpx; }
.record-card__dot { margin: 0 12rpx; color: #d6adb1; }
.record-card__arrow { margin-left: auto; color: var(--red-dark); font-size: 36rpx; line-height: 1; }

.floating-create {
  position: fixed;
  z-index: 5;
  right: 34rpx;
  bottom: calc(30rpx + env(safe-area-inset-bottom));
  width: auto;
  height: 78rpx;
  margin: 0;
  padding: 0 28rpx;
  color: #fffaf6;
  background: linear-gradient(110deg, #542b35, #91404e);
  border-radius: 39rpx 12rpx 39rpx 12rpx;
  box-shadow: 0 16rpx 34rpx rgba(84, 43, 53, 0.26);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 78rpx;
}
</style>
