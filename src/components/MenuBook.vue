<script setup>
import { getMenuThumbnail } from '../domain/menu.js'

defineProps({
  menus: { type: Array, default: () => [] },
  cookName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])
</script>

<template>
  <view class="menu-book">
    <view class="menu-book__corner menu-book__corner--top" />
    <view class="menu-book__corner menu-book__corner--bottom" />

    <view v-if="loading" class="menu-book__state">
      <text class="menu-book__state-title">正在翻菜单…</text>
    </view>

    <view v-else-if="menus.length === 0" class="menu-book__state">
      <text class="menu-book__empty-mark">✦</text>
      <text class="menu-book__state-title">{{ cookName }}还没有菜单</text>
      <text class="menu-book__state-copy">记下第一道菜吧</text>
    </view>

    <view v-else class="menu-book__list">
      <button v-for="menu in menus" :key="menu.id" class="menu-row" @tap="emit('open', menu.id)">
        <text class="menu-row__name">{{ menu.name }}</text>
        <image
          v-if="getMenuThumbnail(menu)"
          class="menu-row__thumbnail"
          :src="getMenuThumbnail(menu)"
          mode="aspectFill"
        />
        <view v-else class="menu-row__thumbnail menu-row__thumbnail--empty">菜</view>
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.menu-book {
  position: relative;
  min-height: 760rpx;
  margin: -2rpx 24rpx 0;
  padding: 68rpx 48rpx 96rpx;
  overflow: hidden;
  background:
    linear-gradient(90deg, transparent 0, rgba(91, 69, 45, 0.035) 50%, transparent 100%),
    var(--paper);
  border: 2rpx solid rgba(74, 55, 40, 0.28);
  border-radius: 0 0 28rpx 28rpx;
  box-shadow: 0 22rpx 50rpx var(--shadow);
}

.menu-book::before {
  position: absolute;
  top: 34rpx;
  right: 46rpx;
  left: 46rpx;
  height: 2rpx;
  background: var(--red);
  opacity: 0.45;
  content: '';
}

.menu-book__corner {
  position: absolute;
  width: 90rpx;
  height: 90rpx;
  border-color: rgba(185, 65, 52, 0.25);
  pointer-events: none;
}

.menu-book__corner--top {
  top: 18rpx;
  left: 18rpx;
  border-top: 2rpx solid;
  border-left: 2rpx solid;
}

.menu-book__corner--bottom {
  right: 18rpx;
  bottom: 18rpx;
  border-right: 2rpx solid;
  border-bottom: 2rpx solid;
}

.menu-book__list {
  width: 100%;
}

.menu-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 100rpx;
  margin: 0;
  padding: 12rpx 4rpx;
  color: var(--ink);
  background: var(--paper);
  border-bottom: 2rpx solid var(--line);
  border-radius: 0;
  text-align: left;
  line-height: 1.4;
}

.menu-row:active {
  background: rgba(185, 65, 52, 0.055);
}

.menu-row__name {
  flex: 1;
  overflow: hidden;
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-row__thumbnail {
  flex: 0 0 auto;
  width: 72rpx;
  height: 72rpx;
  margin-left: 24rpx;
  background: var(--paper-deep);
  border: 4rpx solid #fff;
  border-radius: 50%;
  box-shadow: 0 5rpx 14rpx rgba(74, 56, 36, 0.18);
}

.menu-row__thumbnail--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(185, 65, 52, 0.55);
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 24rpx;
}

.menu-book__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 580rpx;
  color: var(--muted);
}

.menu-book__empty-mark {
  margin-bottom: 28rpx;
  color: var(--red);
  font-size: 52rpx;
}

.menu-book__state-title {
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 34rpx;
  letter-spacing: 4rpx;
}

.menu-book__state-copy {
  margin-top: 16rpx;
  font-size: 24rpx;
}
</style>
