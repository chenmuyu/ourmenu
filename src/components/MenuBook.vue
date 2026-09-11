<script setup>
import { ref, watch } from 'vue'
import { clampSwipeOffset, resolveOpenedMenu } from '../domain/swipe.js'

const props = defineProps({
  menus: { type: Array, default: () => [] },
  cookName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'delete'])
const actionWidth = 76
const openedId = ref('')
const draggingId = ref('')
const startX = ref(0)
const dragOffset = ref(0)
const didDrag = ref(false)

function touchX(event, changed = false) {
  const touches = changed ? event.changedTouches : event.touches
  return touches?.[0]?.clientX ?? 0
}

function startSwipe(event, id) {
  draggingId.value = id
  startX.value = touchX(event)
  dragOffset.value = openedId.value === id ? -actionWidth : 0
  didDrag.value = false
}

function moveSwipe(event, id) {
  if (draggingId.value !== id) return
  const distance = touchX(event) - startX.value
  if (Math.abs(distance) > 5) didDrag.value = true
  dragOffset.value = clampSwipeOffset(distance, openedId.value === id, actionWidth)
}

function endSwipe(event, id) {
  if (draggingId.value !== id) return
  openedId.value = resolveOpenedMenu({
    id,
    openedId: openedId.value,
    startX: startX.value,
    endX: touchX(event, true),
  })
  draggingId.value = ''
}

function rowStyle(id) {
  const offset = draggingId.value === id ? dragOffset.value : openedId.value === id ? -actionWidth : 0
  return `transform: translateX(${offset}px)`
}

function openMenu(id) {
  if (didDrag.value) {
    didDrag.value = false
    return
  }
  if (openedId.value) {
    openedId.value = ''
    return
  }
  emit('open', id)
}

function requestDelete(id) {
  openedId.value = ''
  emit('delete', id)
}

watch(
  () => props.menus,
  () => {
    openedId.value = ''
  },
)
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
      <view v-for="menu in menus" :key="menu.id" class="menu-row-shell">
        <button class="menu-row__delete" @tap.stop="requestDelete(menu.id)">删除</button>
        <button
          class="menu-row"
          :class="{ 'menu-row--dragging': draggingId === menu.id }"
          :style="rowStyle(menu.id)"
          @touchstart="startSwipe($event, menu.id)"
          @touchmove.stop.prevent="moveSwipe($event, menu.id)"
          @touchend="endSwipe($event, menu.id)"
          @tap="openMenu(menu.id)"
        >
          <text class="menu-row__name">{{ menu.name }}</text>
        </button>
      </view>
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

.menu-row-shell {
  position: relative;
  width: 100%;
  min-height: 100rpx;
  overflow: hidden;
  background: var(--red);
  border-bottom: 2rpx solid var(--line);
}

.menu-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 100rpx;
  margin: 0;
  padding: 0 4rpx;
  color: var(--ink);
  background: var(--paper);
  border-radius: 0;
  text-align: left;
  line-height: 1.4;
  transition: transform 180ms ease-out;
  will-change: transform;
}

.menu-row:active {
  background: rgba(185, 65, 52, 0.055);
}

.menu-row--dragging {
  transition: none;
}

.menu-row__delete {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  width: 152rpx;
  height: 100%;
  margin: 0;
  padding: 0;
  color: #fffaf0;
  background: var(--red);
  border-radius: 0;
  font-size: 26rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  line-height: 100rpx;
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
