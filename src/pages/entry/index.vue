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
    errorMessage.value = error?.message || '暂时无法确认身份'
  } finally {
    loading.value = false
  }
}

function updateCode(event) {
  code.value = String(event.detail.value || '').replace(/\D/g, '').slice(0, 4)
  errorMessage.value = ''
}

async function submitCode() {
  if (binding.value) return
  if (code.value.length !== 4) {
    uni.showToast({ title: '请输入四位家庭码', icon: 'none' })
    return
  }

  binding.value = true
  errorMessage.value = ''
  try {
    const result = await repository.bindFamily(code.value)
    applyAccess(result)
    enterHome()
  } catch (error) {
    if (String(error?.message || '').includes('绑定完成')) {
      await resolveEntry()
      return
    }
    const message = error?.message || '家庭码不正确'
    errorMessage.value = message.includes('不支持的操作') ? '云端服务还未更新，请重新部署云函数' : message
    code.value = ''
    uni.showToast({ title: errorMessage.value, icon: 'none' })
  } finally {
    binding.value = false
  }
}

onLoad(resolveEntry)
</script>

<template>
  <view class="entry-page" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="aura aura--top" />
    <view class="aura aura--bottom" />

    <view v-if="loading" class="entry-loading">
      <view class="entry-loading__mark" />
      <text>正在确认你的身份</text>
    </view>

    <view v-else class="entry-content">
      <view class="brand-line">
        <view class="brand-line__mark" />
        <text>我们的厨房</text>
      </view>

      <view class="entry-hero">
        <text class="entry-hero__eyebrow">仅为两个家庭成员保留</text>
        <text class="entry-hero__title">我和你的</text>
        <text class="entry-hero__title entry-hero__title--accent">一日三餐</text>
        <text class="entry-hero__subtitle">一起记下做过的菜，也收藏下一次想去尝尝的味道。</text>
      </view>

      <view class="code-card">
        <view class="code-card__header">
          <view>
            <text class="code-card__title">加入这个家</text>
            <text class="code-card__label">输入四位家庭码</text>
          </view>
          <view class="together-mark">
            <text>我</text>
            <view class="together-mark__plus">＋</view>
            <text>你</text>
          </view>
        </view>

        <view class="code-boxes">
          <view v-for="(digit, index) in digits" :key="index" class="code-box" :class="{ 'code-box--filled': digit }">
            {{ digit }}
          </view>
          <input
            class="code-input"
            :value="code"
            type="number"
            maxlength="4"
            focus
            confirm-type="done"
            @input="updateCode"
            @confirm="submitCode"
          />
        </view>

        <button class="home-button" :loading="binding" :disabled="binding" @tap="submitCode">确认加入</button>
        <text class="code-card__hint">绑定后，这台微信会成为家庭成员</text>
      </view>

      <view v-if="errorMessage" class="entry-error" @tap="resolveEntry">{{ errorMessage }}，轻触重试</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.entry-page {
  position: relative;
  min-height: 100vh;
  padding-right: 42rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  padding-left: 42rpx;
  overflow: hidden;
  background: #fffbf8;
}

.entry-content,
.entry-loading {
  position: relative;
  z-index: 2;
}

.entry-content {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 48px);
}

.entry-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: #8f7d7c;
  font-size: 24rpx;
}

.entry-loading__mark,
.brand-line__mark {
  width: 14rpx;
  height: 14rpx;
  background: #f07f84;
  border-radius: 50%;
}

.entry-loading__mark {
  margin-bottom: 22rpx;
  animation: pulse 1.4s ease-in-out infinite;
}

.brand-line {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding-top: 34rpx;
  color: #665755;
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.entry-hero {
  padding: 104rpx 2rpx 58rpx;
}

.entry-hero text,
.code-card__title,
.code-card__label,
.code-card__hint {
  display: block;
}

.entry-hero__eyebrow {
  width: max-content;
  margin-bottom: 26rpx;
  padding: 12rpx 18rpx;
  color: #a75c61;
  background: rgba(240, 127, 132, 0.1);
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.entry-hero__title {
  color: #302b2a;
  font-size: 82rpx;
  font-weight: 800;
  letter-spacing: -5rpx;
  line-height: 1.08;
}

.entry-hero__title--accent {
  color: #e66f75;
}

.entry-hero__subtitle {
  max-width: 590rpx;
  margin-top: 30rpx;
  color: #7d706e;
  font-size: 24rpx;
  line-height: 1.75;
}

.code-card {
  margin-top: auto;
  padding: 36rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid rgba(80, 63, 60, 0.07);
  border-radius: 32rpx;
  box-shadow: 0 24rpx 70rpx rgba(73, 46, 43, 0.09);
}

.code-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-card__title {
  color: #302b2a;
  font-size: 32rpx;
  font-weight: 750;
}

.code-card__label {
  margin-top: 9rpx;
  color: #948583;
  font-size: 21rpx;
}

.together-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7rpx;
  height: 62rpx;
  padding: 0 19rpx;
  color: #554a48;
  background: #fff5f2;
  border-radius: 31rpx;
  font-size: 23rpx;
  font-weight: 700;
}

.together-mark__plus {
  color: #e66f75;
  font-size: 20rpx;
  font-weight: 400;
}

.code-boxes {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 14rpx;
  margin: 34rpx 0 28rpx;
}

.code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 94rpx;
  color: #302b2a;
  background: #faf7f5;
  border: 2rpx solid transparent;
  border-radius: 20rpx;
  font-size: 34rpx;
  font-weight: 650;
}

.code-box--filled {
  background: #fff;
  border-color: rgba(230, 111, 117, 0.5);
  box-shadow: 0 8rpx 22rpx rgba(73, 46, 43, 0.07);
}

.code-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.home-button {
  height: 92rpx;
  color: #fff;
  background: #e66f75;
  border-radius: 22rpx;
  box-shadow: 0 16rpx 30rpx rgba(230, 111, 117, 0.22);
  font-size: 27rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  line-height: 92rpx;
}

.code-card__hint {
  margin-top: 20rpx;
  color: #a09290;
  font-size: 19rpx;
  text-align: center;
}

.entry-error {
  margin-top: 22rpx;
  color: #b34e55;
  font-size: 21rpx;
  text-align: center;
}

.aura {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(8rpx);
}

.aura--top {
  top: 90rpx;
  right: -190rpx;
  width: 470rpx;
  height: 470rpx;
  background: radial-gradient(circle, rgba(255, 206, 197, 0.42), rgba(255, 206, 197, 0));
}

.aura--bottom {
  bottom: -240rpx;
  left: -210rpx;
  width: 560rpx;
  height: 560rpx;
  background: radial-gradient(circle, rgba(245, 184, 170, 0.22), rgba(245, 184, 170, 0));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.5); opacity: 1; }
}
</style>
