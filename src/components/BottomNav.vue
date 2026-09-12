<script setup>
const props = defineProps({ active: { type: String, required: true } })

function switchPage(target) {
  if (target === props.active) return
  const url = target === 'kitchen' ? '/pages/home/index' : '/pages/wish-home/index'
  uni.reLaunch({ url })
}
</script>

<template>
  <view class="bottom-nav">
    <button class="bottom-nav__item" :class="{ 'bottom-nav__item--active': active === 'kitchen' }" @tap="switchPage('kitchen')">
      <text class="bottom-nav__mark">粤</text>
      <text class="bottom-nav__label">粤湘情</text>
    </button>
    <view class="bottom-nav__heart">♡</view>
    <button class="bottom-nav__item" :class="{ 'bottom-nav__item--active': active === 'wish' }" @tap="switchPage('wish')">
      <text class="bottom-nav__mark">想</text>
      <text class="bottom-nav__label">想吃这个</text>
    </button>
  </view>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  z-index: 20;
  right: 26rpx;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  left: 26rpx;
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 10rpx;
  background: rgba(255, 253, 249, 0.9);
  border: 2rpx solid rgba(255, 255, 255, 0.88);
  border-radius: 52rpx 22rpx 52rpx 22rpx;
  box-shadow: 0 20rpx 46rpx rgba(101, 39, 56, 0.2);
  backdrop-filter: blur(22rpx);
}

.bottom-nav__item {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 82rpx;
  margin: 0;
  padding: 0;
  color: #a17a82;
  background: transparent;
  border-radius: 41rpx 14rpx 41rpx 14rpx;
  line-height: 1;
}

.bottom-nav__item--active {
  color: #fff;
  background: linear-gradient(110deg, var(--red-dark), var(--red));
  box-shadow: 0 12rpx 22rpx rgba(185, 68, 91, 0.22);
}

.bottom-nav__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  margin-right: 10rpx;
  border: 2rpx solid currentColor;
  border-radius: 50%;
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 24rpx;
  font-weight: 900;
}

.bottom-nav__label {
  font-size: 23rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.bottom-nav__heart {
  width: 34rpx;
  color: var(--red);
  font-size: 25rpx;
  text-align: center;
}
</style>
