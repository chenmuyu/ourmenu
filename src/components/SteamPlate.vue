<template>
  <view class="steam-plate" aria-label="暂无图片">
    <view class="steam steam--left" />
    <view class="steam steam--right" />
    <view class="plate"><view class="plate__inside" /></view>
  </view>
</template>

<style scoped lang="scss">
.steam-plate {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-bottom: 14rpx;
}

.plate {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 18rpx;
  border: 3rpx solid rgba(185, 68, 91, 0.58);
  border-radius: 50%;
}

.plate__inside {
  width: 29rpx;
  height: 7rpx;
  border-top: 2rpx solid rgba(185, 68, 91, 0.38);
  border-radius: 50%;
}

.steam {
  position: absolute;
  top: 12rpx;
  width: 12rpx;
  height: 24rpx;
  border-left: 3rpx solid rgba(238, 113, 128, 0.55);
  border-radius: 50%;
  transform: rotate(12deg);
}

.steam--left { left: 26rpx; }
.steam--right { right: 23rpx; top: 8rpx; transform: rotate(-14deg); }
</style>
