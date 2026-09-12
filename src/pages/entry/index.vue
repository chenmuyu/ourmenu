<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { applyAccess, loadAccess } from '../../access/session.js'
import { repository } from '../../repositories/index.js'

const statusBarHeight = uni.getWindowInfo?.().statusBarHeight || 24
const code = ref('')
const loading = ref(true)
const binding = ref(false)
const errorMessage = ref('')
const digits = computed(() => Array.from({ length: 4 }, (_, index) => code.value[index] || ''))

function enterHome() {
  uni.reLaunch({ url: '/pages/home/index' })
}

async function resolveEntry() {
  loading.value = true
  errorMessage.value = ''
  try {
    const access = await loadAccess(repository)
    if (access.role === 'family' || access.role === 'guest') enterHome()
  } catch (error) {
    errorMessage.value = error?.message || '暂时进不了小厨房'
  } finally {
    loading.value = false
  }
}

function updateCode(event) {
  code.value = String(event.detail.value || '').replace(/\D/g, '').slice(0, 4)
}

async function submitCode() {
  if (binding.value) return
  if (code.value.length !== 4) {
    uni.showToast({ title: '请输入四位家庭码', icon: 'none' })
    return
  }

  binding.value = true
  try {
    const result = await repository.bindFamily(code.value)
    applyAccess(result)
    enterHome()
  } catch (error) {
    if (String(error?.message || '').includes('绑定完成')) {
      await resolveEntry()
      return
    }
    code.value = ''
    uni.showToast({ title: error?.message || '家庭码不正确', icon: 'none' })
  } finally {
    binding.value = false
  }
}

onLoad(resolveEntry)
</script>

<template>
  <view class="entry-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="bubble bubble--one" />
    <view class="bubble bubble--two" />
    <view class="bubble bubble--three" />
    <view class="bubble bubble--four">♡</view>

    <view v-if="loading" class="entry-loading">
      <view class="entry-loading__heart">♡</view>
      <text>正在认出回家的人…</text>
    </view>

    <view v-else class="entry-content">
      <view class="entry-copy">
        <text class="entry-copy__eyebrow">A LITTLE HOME, A LOT OF LOVE</text>
        <text class="entry-copy__hello">欢迎回到</text>
        <text class="entry-copy__title">我们的小厨房</text>
        <text class="entry-copy__subtitle">把喜欢的味道，慢慢过成我们的日子。</text>
      </view>

      <view class="code-card">
        <view class="code-card__avatars">
          <view class="avatar-orbit avatar-orbit--wife">我</view>
          <view class="avatar-line"><text>♡</text></view>
          <view class="avatar-orbit avatar-orbit--husband">他</view>
        </view>
        <text class="code-card__label">输入属于我们的小暗号</text>
        <view class="code-boxes">
          <view v-for="(digit, index) in digits" :key="index" class="code-box" :class="{ 'code-box--filled': digit }">
            {{ digit ? '●' : '' }}
          </view>
          <input
            class="code-input"
            :value="code"
            type="number"
            maxlength="4"
            focus
            @input="updateCode"
            @confirm="submitCode"
          />
        </view>
        <button class="home-button" :loading="binding" :disabled="binding" @tap="submitCode">回到我们的小家</button>
        <text class="code-card__hint">家庭位置只为两个人保留</text>
      </view>

      <view v-if="errorMessage" class="entry-error" @tap="resolveEntry">{{ errorMessage }}，轻触重试</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.entry-page {
  position: relative;
  min-height: 100vh;
  padding-right: 38rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  padding-left: 38rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 255, 255, 0.98) 0 9%, transparent 29%),
    radial-gradient(circle at 86% 8%, rgba(255, 193, 181, 0.58), transparent 30%),
    linear-gradient(152deg, #fffdfb 0%, #fff1ec 48%, #ffd8d2 100%);
}

.entry-page::after {
  position: absolute;
  right: -180rpx;
  bottom: -220rpx;
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(circle, rgba(238, 113, 128, 0.2), rgba(238, 113, 128, 0));
  content: '';
}

.entry-content,
.entry-loading {
  position: relative;
  z-index: 2;
}

.entry-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: var(--muted);
  font-size: 25rpx;
  letter-spacing: 3rpx;
}

.entry-loading__heart {
  margin-bottom: 20rpx;
  color: var(--red);
  font-size: 72rpx;
  animation: heartbeat 1.6s ease-in-out infinite;
}

.entry-copy {
  padding: 82rpx 8rpx 46rpx;
}

.entry-copy text {
  display: block;
}

.entry-copy__eyebrow {
  margin-bottom: 24rpx;
  color: var(--red-dark);
  font-family: Georgia, serif;
  font-size: 17rpx;
  letter-spacing: 4rpx;
}

.entry-copy__hello {
  margin-left: 8rpx;
  color: var(--muted);
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 42rpx;
  transform: rotate(-4deg);
  transform-origin: left center;
}

.entry-copy__title {
  margin-top: -12rpx;
  color: var(--ink);
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 86rpx;
  font-weight: 900;
  letter-spacing: -2rpx;
  line-height: 1.08;
  text-shadow: 5rpx 8rpx 0 rgba(232, 201, 140, 0.42);
}

.entry-copy__subtitle {
  margin-top: 28rpx;
  color: #865a65;
  font-size: 24rpx;
  letter-spacing: 2rpx;
}

.code-card {
  position: relative;
  padding: 42rpx 34rpx 34rpx;
  overflow: hidden;
  background: rgba(255, 253, 249, 0.82);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  border-radius: 40rpx 12rpx 40rpx 12rpx;
  box-shadow: 0 30rpx 70rpx rgba(128, 52, 72, 0.16);
  backdrop-filter: blur(20rpx);
}

.code-card::before {
  position: absolute;
  top: -70rpx;
  right: -50rpx;
  width: 190rpx;
  height: 190rpx;
  border: 28rpx solid rgba(255, 193, 181, 0.18);
  border-radius: 50%;
  content: '';
}

.code-card__avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.avatar-orbit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78rpx;
  height: 78rpx;
  color: #fff;
  border: 5rpx solid #fff;
  border-radius: 50%;
  box-shadow: 0 8rpx 18rpx rgba(93, 39, 54, 0.15);
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 30rpx;
}

.avatar-orbit--wife { background: var(--red); }
.avatar-orbit--husband { background: var(--ink); }

.avatar-line {
  width: 100rpx;
  color: var(--red);
  border-top: 2rpx dashed rgba(238, 113, 128, 0.52);
  text-align: center;
  line-height: 0;
}

.avatar-line text {
  padding: 0 10rpx;
  background: #fffaf7;
  font-size: 30rpx;
}

.code-card__label,
.code-card__hint {
  display: block;
  text-align: center;
}

.code-card__label {
  color: var(--ink);
  font-size: 25rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.code-boxes {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 18rpx;
  margin: 28rpx 0 34rpx;
}

.code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86rpx;
  height: 96rpx;
  color: var(--red-dark);
  background: #fff;
  border: 2rpx solid rgba(185, 68, 91, 0.18);
  border-radius: 24rpx 8rpx 24rpx 8rpx;
  box-shadow: inset 0 -6rpx 0 rgba(255, 193, 181, 0.18);
  font-size: 24rpx;
}

.code-box--filled {
  border-color: var(--red);
  box-shadow: 0 10rpx 22rpx rgba(238, 113, 128, 0.13);
}

.code-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.home-button {
  height: 94rpx;
  color: #fff;
  background: linear-gradient(110deg, var(--red-dark), var(--red));
  border-radius: 47rpx 16rpx 47rpx 16rpx;
  box-shadow: 0 18rpx 32rpx rgba(185, 68, 91, 0.25);
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  line-height: 94rpx;
}

.code-card__hint {
  margin-top: 22rpx;
  color: var(--muted);
  font-size: 20rpx;
  letter-spacing: 2rpx;
}

.entry-error {
  margin-top: 28rpx;
  color: var(--red-dark);
  font-size: 23rpx;
  text-align: center;
}

.bubble {
  position: absolute;
  z-index: 1;
  border: 2rpx solid rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  box-shadow: inset 12rpx 12rpx 28rpx rgba(255, 255, 255, 0.35);
  animation: float 7s ease-in-out infinite;
}

.bubble--one { top: 180rpx; right: 36rpx; width: 84rpx; height: 84rpx; background: rgba(255, 193, 181, 0.24); }
.bubble--two { top: 510rpx; left: -30rpx; width: 118rpx; height: 118rpx; background: rgba(232, 201, 140, 0.17); animation-delay: -2s; }
.bubble--three { right: 80rpx; bottom: 260rpx; width: 54rpx; height: 54rpx; background: rgba(238, 113, 128, 0.14); animation-delay: -4s; }
.bubble--four { top: 360rpx; right: 110rpx; display: flex; align-items: center; justify-content: center; width: 46rpx; height: 46rpx; color: var(--red); font-size: 24rpx; animation-delay: -1s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-28rpx) rotate(8deg); }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.14); }
}
</style>
