<script setup>
defineProps({
  members: { type: Array, default: () => [] },
  selectedId: { type: String, default: '' },
})

const emit = defineEmits(['select'])

function initial(name) {
  return String(name || '我').slice(0, 1)
}
</script>

<template>
  <view class="cook-tabs" aria-label="掌勺人切换">
    <button
      v-for="(member, index) in members"
      :key="member.id"
      class="cook-tab"
      :class="{ 'cook-tab--active': member.id === selectedId, 'cook-tab--right': index === 1 }"
      @tap="emit('select', member.id)"
    >
      <image v-if="member.avatarUrl" class="cook-tab__avatar" :src="member.avatarUrl" mode="aspectFill" />
      <view v-else class="cook-tab__avatar cook-tab__avatar--fallback">{{ initial(member.name) }}</view>
      <text class="cook-tab__name">{{ member.name }}</text>
      <text v-if="member.id === selectedId" class="cook-tab__mark">掌勺菜单</text>
    </button>
  </view>
</template>

<style scoped lang="scss">
.cook-tabs {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 156rpx;
  padding: 0 24rpx;
}

.cook-tab {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  width: 50%;
  height: 120rpx;
  margin: 0;
  padding: 18rpx 24rpx;
  color: var(--muted);
  background: #dfd2bd;
  border: 2rpx solid rgba(74, 55, 40, 0.16);
  border-bottom: 0;
  border-radius: 28rpx 28rpx 0 0;
  line-height: 1;
  transition: height 180ms ease, background 180ms ease;
}

.cook-tab--right {
  margin-left: -2rpx;
}

.cook-tab--active {
  z-index: 3;
  height: 148rpx;
  color: var(--ink);
  background: var(--paper);
  border-color: rgba(74, 55, 40, 0.28);
  box-shadow: 0 -12rpx 28rpx rgba(74, 56, 36, 0.08);
}

.cook-tab__avatar {
  flex: 0 0 auto;
  width: 68rpx;
  height: 68rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.78);
  border-radius: 50%;
  box-shadow: 0 4rpx 10rpx rgba(64, 45, 29, 0.12);
}

.cook-tab__avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fffaf0;
  font-size: 30rpx;
  font-weight: 700;
  background: var(--red);
}

.cook-tab--right .cook-tab__avatar--fallback {
  background: var(--green);
}

.cook-tab__name {
  margin-left: 16rpx;
  font-size: 31rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.cook-tab__mark {
  position: absolute;
  right: 22rpx;
  bottom: 16rpx;
  color: var(--red);
  font-size: 19rpx;
  font-weight: 500;
  letter-spacing: 2rpx;
}
</style>
