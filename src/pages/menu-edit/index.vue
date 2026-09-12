<script setup>
import { computed, reactive, ref } from 'vue'
import { onBackPress, onLoad } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { validateMenu } from '../../domain/menu.js'
import { repository } from '../../repositories/index.js'
import { chooseImages, mergeImagePaths, uploadForCurrentMode } from '../../services/imageService.js'

const kitchen = ref({ members: [], groups: [], tags: [] })
const menuId = ref('')
const saving = ref(false)
const loading = ref(true)
const dirty = ref(false)
const allowLeave = ref(false)
const form = reactive({
  name: '',
  cookId: '',
  cookedAt: new Date().toISOString().slice(0, 10),
  groupId: 'other',
  tagIds: [],
  coverUrl: '',
  imageUrls: [],
  note: '',
  createdAt: undefined,
})

const pageTitle = computed(() => (menuId.value ? '编辑这道菜' : '记一道新菜'))
const selectedCookIndex = computed(() => Math.max(0, kitchen.value.members.findIndex((member) => member.id === form.cookId)))
const memberNames = computed(() => kitchen.value.members.map((member) => member.name))
const activeGroups = computed(() => kitchen.value.groups.filter((item) => item.active !== false || item.id === form.groupId))
const groupNames = computed(() => activeGroups.value.map((group) => group.name))
const selectedGroupIndex = computed(() => Math.max(0, activeGroups.value.findIndex((group) => group.id === form.groupId)))
const activeTags = computed(() => kitchen.value.tags.filter((item) => item.active !== false || form.tagIds.includes(item.id)))

function markDirty() {
  dirty.value = true
}

async function loadPage(options) {
  loading.value = true
  try {
    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以记录菜谱', icon: 'none' })
      setTimeout(() => uni.reLaunch({ url: '/pages/home/index' }), 300)
      return
    }
    kitchen.value = await repository.getKitchen()
    menuId.value = decodeURIComponent(options.id || '')
    if (menuId.value) {
      const current = await repository.getMenu(menuId.value)
      if (!current) throw new Error('这道菜已经不存在了')
      Object.assign(form, current)
      form.tagIds = Array.isArray(current.tagIds) ? [...current.tagIds] : []
      form.groupId = current.groupId || 'other'
    } else {
      const cookId = decodeURIComponent(options.cookId || '')
      form.cookId = kitchen.value.members.some((member) => member.id === cookId)
        ? cookId
        : kitchen.value.members[0]?.id || ''
    }
    dirty.value = false
  } catch (error) {
    uni.showToast({ title: error?.message || '页面加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function changeGroup(event) {
  form.groupId = activeGroups.value[Number(event.detail.value)]?.id || 'other'
  markDirty()
}

function toggleTag(id) {
  const index = form.tagIds.indexOf(id)
  if (index >= 0) form.tagIds.splice(index, 1)
  else form.tagIds.push(id)
  markDirty()
}

function changeCook(event) {
  form.cookId = kitchen.value.members[Number(event.detail.value)]?.id || form.cookId
  markDirty()
}

function changeDate(event) {
  form.cookedAt = event.detail.value
  markDirty()
}

async function uploadPaths(paths) {
  const results = []
  for (const path of paths) results.push(await uploadForCurrentMode(path))
  if (results.some((item) => item.pending)) {
    uni.showToast({ title: '图片暂存本机，联网后请重新上传', icon: 'none' })
  }
  return results.map((item) => item.url)
}

async function chooseCover() {
  try {
    const paths = await chooseImages(1)
    const [url] = await uploadPaths(paths)
    if (url) {
      form.coverUrl = url
      markDirty()
    }
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

async function chooseDetailImages() {
  try {
    const paths = await chooseImages(9 - form.imageUrls.length)
    const urls = await uploadPaths(paths)
    form.imageUrls = mergeImagePaths(form.imageUrls, urls, 9)
    markDirty()
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

function removeDetailImage(index) {
  form.imageUrls.splice(index, 1)
  markDirty()
}

function moveImage(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.imageUrls.length) return
  const [image] = form.imageUrls.splice(index, 1)
  form.imageUrls.splice(target, 0, image)
  markDirty()
}

async function saveMenu() {
  if (saving.value) return
  const validation = validateMenu(form, kitchen.value.members)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  saving.value = true
  try {
    const saved = await repository.saveMenu({
      ...form,
      id: menuId.value || undefined,
      name: form.name.trim(),
    })
    dirty.value = false
    allowLeave.value = true
    uni.showToast({ title: '已记入菜单', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/menu-detail/index?id=${encodeURIComponent(saved.id)}` })
    }, 350)
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function deleteMenu() {
  uni.showModal({
    title: '删除这道菜？',
    content: '删除后无法恢复，两个人都将看不到这条记录。',
    confirmColor: '#b94134',
    success: async ({ confirm }) => {
      if (!confirm) return
      await repository.deleteMenu(menuId.value)
      dirty.value = false
      allowLeave.value = true
      uni.reLaunch({ url: '/pages/home/index' })
    },
  })
}

onLoad(loadPage)
onBackPress(() => {
  if (!dirty.value || allowLeave.value) return false
  uni.showModal({
    title: '还没有保存',
    content: '现在离开会丢失本次修改。',
    confirmText: '放弃修改',
    confirmColor: '#b94134',
    success: ({ confirm }) => {
      if (confirm) {
        allowLeave.value = true
        uni.navigateBack()
      }
    },
  })
  return true
})
</script>

<template>
  <view class="edit-page">
    <view v-if="loading" class="page-state">正在准备菜单纸…</view>
    <view v-else class="form-paper">
      <view class="form-heading">
        <text class="form-heading__eyebrow">KITCHEN NOTE</text>
        <text class="form-heading__title">{{ pageTitle }}</text>
      </view>

      <view class="field">
        <text class="field__label">菜名 *</text>
        <input v-model="form.name" class="field__input" maxlength="30" placeholder="例如：番茄炒蛋" @input="markDirty" />
      </view>

      <view class="field-row">
        <view class="field field--half">
          <text class="field__label">掌勺人 *</text>
          <picker :range="memberNames" :value="selectedCookIndex" @change="changeCook">
            <view class="field__picker">{{ kitchen.members[selectedCookIndex]?.name }} <text>⌄</text></view>
          </picker>
        </view>
        <view class="field field--half">
          <text class="field__label">做菜日期</text>
          <picker mode="date" :value="form.cookedAt" @change="changeDate">
            <view class="field__picker">{{ form.cookedAt }} <text>⌄</text></view>
          </picker>
        </view>
      </view>

      <view class="field">
        <text class="field__label">主食材分组</text>
        <picker :range="groupNames" :value="selectedGroupIndex" @change="changeGroup">
          <view class="field__picker">{{ activeGroups[selectedGroupIndex]?.name || '其他' }} <text>⌄</text></view>
        </picker>
      </view>

      <view class="field">
        <text class="field__label">菜品标签</text>
        <view class="tag-options">
          <button
            v-for="tag in activeTags"
            :key="tag.id"
            class="tag-option"
            :class="{ 'tag-option--active': form.tagIds.includes(tag.id) }"
            @tap="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </button>
        </view>
        <text class="field__hint">自定义标签请到“小家设置”中添加</text>
      </view>

      <view class="field">
        <text class="field__label">封面图（选填）</text>
        <button v-if="!form.coverUrl" class="cover-upload" @tap="chooseCover">
          <text class="cover-upload__plus">＋</text>
          <text>上传成品图</text>
        </button>
        <view v-else class="cover-preview" @tap="chooseCover">
          <image class="cover-preview__image" :src="form.coverUrl" mode="aspectFill" />
          <view class="cover-preview__action">点击更换</view>
        </view>
      </view>

      <view class="field">
        <view class="field__heading-row">
          <text class="field__label">更多图片</text>
          <text class="field__count">{{ form.imageUrls.length }}/9</text>
        </view>
        <view class="image-grid">
          <view v-for="(imageUrl, index) in form.imageUrls" :key="imageUrl" class="image-tile">
            <image class="image-tile__image" :src="imageUrl" mode="aspectFill" />
            <button class="image-tile__remove" @tap.stop="removeDetailImage(index)">×</button>
            <view class="image-tile__order">
              <button :disabled="index === 0" @tap.stop="moveImage(index, -1)">‹</button>
              <button :disabled="index === form.imageUrls.length - 1" @tap.stop="moveImage(index, 1)">›</button>
            </view>
          </view>
          <button v-if="form.imageUrls.length < 9" class="image-add" @tap="chooseDetailImages">＋</button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">备注</text>
        <textarea
          v-model="form.note"
          class="field__textarea"
          maxlength="300"
          placeholder="这次用了什么小诀窍？"
          @input="markDirty"
        />
      </view>

      <button class="save-button" :loading="saving" :disabled="saving" @tap="saveMenu">
        {{ saving ? '正在保存' : '记入菜单' }}
      </button>
      <button v-if="menuId" class="delete-button" @tap="deleteMenu">删除这道菜</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.edit-page {
  min-height: 100vh;
  padding: 28rpx 24rpx calc(56rpx + env(safe-area-inset-bottom));
  background: linear-gradient(150deg, #fff9f5, #ffe4df);
}

.page-state {
  padding-top: 260rpx;
  color: var(--muted);
  text-align: center;
}

.form-paper {
  padding: 46rpx 38rpx 52rpx;
  background: var(--paper);
  border: 2rpx solid rgba(74, 55, 40, 0.18);
  border-radius: 22rpx;
  box-shadow: 0 18rpx 44rpx var(--shadow);
}

.form-heading {
  padding-bottom: 38rpx;
  border-bottom: 2rpx solid var(--line);
}

.form-heading__eyebrow,
.form-heading__title {
  display: block;
}

.form-heading__eyebrow {
  margin-bottom: 12rpx;
  color: var(--red);
  font-family: Georgia, serif;
  font-size: 18rpx;
  letter-spacing: 5rpx;
}

.form-heading__title {
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
}

.field {
  margin-top: 42rpx;
}

.field-row {
  display: flex;
  gap: 22rpx;
}

.field--half {
  flex: 1;
  min-width: 0;
}

.field__label {
  display: block;
  margin-bottom: 16rpx;
  color: #5b5147;
  font-size: 23rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.field__input,
.field__picker,
.field__textarea {
  width: 100%;
  color: var(--ink);
  background: #fff3ee;
  border: 2rpx solid rgba(185, 68, 91, 0.12);
  border-radius: 10rpx;
  font-size: 28rpx;
}

.field__input,
.field__picker {
  height: 84rpx;
  padding: 0 22rpx;
  line-height: 84rpx;
}

.field__picker {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.field__textarea {
  height: 230rpx;
  padding: 22rpx;
  line-height: 1.7;
}

.field__heading-row {
  display: flex;
  justify-content: space-between;
}

.field__count {
  color: var(--muted);
  font-size: 22rpx;
}

.field__hint {
  display: block;
  margin-top: 15rpx;
  color: var(--muted);
  font-size: 20rpx;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.tag-option {
  width: auto;
  height: 62rpx;
  margin: 0;
  padding: 0 24rpx;
  color: var(--muted);
  background: #fff3ee;
  border: 2rpx solid rgba(185, 68, 91, 0.12);
  border-radius: 31rpx 10rpx 31rpx 10rpx;
  font-size: 22rpx;
  line-height: 60rpx;
}

.tag-option--active {
  color: #fff;
  background: var(--red-dark);
  border-color: var(--red-dark);
}

.cover-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  margin: 0;
  color: var(--muted);
  background: #f7efdf;
  border: 2rpx dashed rgba(74, 55, 40, 0.3);
  border-radius: 12rpx;
  font-size: 24rpx;
}

.cover-upload__plus {
  margin-bottom: 12rpx;
  color: var(--red);
  font-size: 60rpx;
  font-weight: 300;
}

.cover-preview {
  position: relative;
  height: 360rpx;
  overflow: hidden;
  border-radius: 12rpx;
}

.cover-preview__image {
  width: 100%;
  height: 100%;
}

.cover-preview__action {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  padding: 10rpx 18rpx;
  color: #fff;
  background: rgba(32, 24, 18, 0.66);
  border-radius: 24rpx;
  font-size: 21rpx;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.image-tile,
.image-add {
  position: relative;
  height: 180rpx;
  margin: 0;
  overflow: hidden;
  border-radius: 10rpx;
}

.image-tile__image {
  width: 100%;
  height: 100%;
}

.image-tile__remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 42rpx;
  height: 42rpx;
  margin: 0;
  padding: 0;
  color: #fff;
  background: rgba(32, 24, 18, 0.72);
  border-radius: 50%;
  font-size: 32rpx;
  line-height: 38rpx;
}

.image-tile__order {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  left: 8rpx;
  display: flex;
  justify-content: space-between;
}

.image-tile__order button {
  width: 42rpx;
  height: 42rpx;
  margin: 0;
  padding: 0;
  color: #fff;
  background: rgba(32, 24, 18, 0.65);
  border-radius: 50%;
  font-size: 34rpx;
  line-height: 36rpx;
}

.image-add {
  color: var(--red);
  background: #f7efdf;
  border: 2rpx dashed rgba(74, 55, 40, 0.3);
  font-size: 52rpx;
  font-weight: 300;
  line-height: 176rpx;
}

.save-button {
  height: 92rpx;
  margin-top: 58rpx;
  color: #fffaf0;
  background: var(--red);
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 5rpx;
  line-height: 92rpx;
}

.delete-button {
  height: 78rpx;
  margin-top: 20rpx;
  color: var(--red-dark);
  background: transparent;
  font-size: 24rpx;
  line-height: 78rpx;
}
</style>
