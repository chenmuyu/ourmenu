<script setup>
import { computed, reactive, ref } from 'vue'
import { onBackPress, onLoad } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { validateWish, WISH_STATUSES } from '../../domain/wish.js'
import { repository } from '../../repositories/index.js'
import { chooseImages, mergeImagePaths, uploadForCurrentMode } from '../../services/imageService.js'

const wishId = ref('')
const loading = ref(true)
const saving = ref(false)
const dirty = ref(false)
const allowLeave = ref(false)
const form = reactive({
  name: '',
  status: 'want',
  coverUrl: '',
  imageUrls: [],
  source: '',
  tastedAt: '',
  note: '',
  createdAt: undefined,
})

const pageTitle = computed(() => (wishId.value ? '编辑这份心动' : '记下想吃的'))

function markDirty() {
  dirty.value = true
}

async function loadPage(options) {
  loading.value = true
  try {
    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以记录心愿', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/wish-home/index' }), 300)
      return
    }

    wishId.value = decodeURIComponent(options.id || '')
    if (wishId.value) {
      const current = await repository.getWish(wishId.value)
      if (!current) throw new Error('这份心动已经不存在了')
      Object.assign(form, current)
      form.imageUrls = Array.isArray(current.imageUrls) ? [...current.imageUrls] : []
    } else if (['want', 'again'].includes(options.status)) {
      form.status = options.status
    }
    dirty.value = false
  } catch (error) {
    uni.showToast({ title: error?.message || '页面加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
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
    const [url] = await uploadPaths(await chooseImages(1))
    if (url) {
      form.coverUrl = url
      markDirty()
    }
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

async function chooseMoreImages() {
  try {
    const urls = await uploadPaths(await chooseImages(9 - form.imageUrls.length))
    form.imageUrls = mergeImagePaths(form.imageUrls, urls, 9)
    markDirty()
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择图片失败', icon: 'none' })
  }
}

function removeImage(index) {
  form.imageUrls.splice(index, 1)
  markDirty()
}

function chooseStatus(status) {
  form.status = status
  markDirty()
}

function changeDate(event) {
  form.tastedAt = event.detail.value
  markDirty()
}

async function saveWish() {
  if (saving.value) return
  const validation = validateWish(form)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  saving.value = true
  try {
    const saved = await repository.saveWish({ ...form, id: wishId.value || undefined, name: form.name.trim() })
    dirty.value = false
    allowLeave.value = true
    uni.showToast({ title: '已经替你记住啦', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: `/pages/wish-detail/index?id=${encodeURIComponent(saved.id)}` }), 350)
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function deleteWish() {
  uni.showModal({
    title: '删除这份心动？',
    content: '删除后就找不回来啦。',
    confirmColor: '#b9445b',
    success: async ({ confirm }) => {
      if (!confirm) return
      await repository.deleteWish(wishId.value)
      dirty.value = false
      allowLeave.value = true
      uni.switchTab({ url: '/pages/wish-home/index' })
    },
  })
}

onLoad(loadPage)
onBackPress(() => {
  if (!dirty.value || allowLeave.value) return false
  uni.showModal({
    title: '还没有保存',
    content: '现在离开会丢失刚刚填写的内容。',
    confirmText: '放弃修改',
    confirmColor: '#b9445b',
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
    <view v-if="loading" class="page-state">正在铺开心愿纸…</view>
    <view v-else class="form-card">
      <view class="form-heading">
        <text class="form-heading__eyebrow">ONE MORE THING TO LOVE</text>
        <text class="form-heading__title">{{ pageTitle }}</text>
      </view>

      <view class="field">
        <text class="field__label">好吃好喝的名字 *</text>
        <input v-model="form.name" class="field__input" maxlength="40" placeholder="例如：生椰拿铁" @input="markDirty" />
      </view>

      <view class="field">
        <text class="field__label">现在是什么心情 *</text>
        <view class="status-options">
          <button
            v-for="status in WISH_STATUSES"
            :key="status.id"
            class="status-option"
            :class="{ 'status-option--active': form.status === status.id }"
            @tap="chooseStatus(status.id)"
          >
            {{ status.name }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="field__label">图片（选填）</text>
        <button v-if="!form.coverUrl" class="cover-upload" @tap="chooseCover"><text class="cover-upload__plus">＋</text><text>放一张心动照片</text></button>
        <view v-else class="cover-preview" @tap="chooseCover">
          <image class="cover-preview__image" :src="form.coverUrl" mode="aspectFill" />
          <text class="cover-preview__action">点击更换</text>
        </view>
      </view>

      <view class="field">
        <view class="field__row"><text class="field__label">更多图片</text><text class="field__count">{{ form.imageUrls.length }}/9</text></view>
        <view class="image-grid">
          <view v-for="(imageUrl, index) in form.imageUrls" :key="imageUrl" class="image-tile">
            <image class="image-tile__image" :src="imageUrl" mode="aspectFill" />
            <button class="image-tile__remove" @tap.stop="removeImage(index)">×</button>
          </view>
          <button v-if="form.imageUrls.length < 9" class="image-add" @tap="chooseMoreImages">＋</button>
        </view>
      </view>

      <view class="field-row">
        <view class="field field--half">
          <text class="field__label">店名或来源</text>
          <input v-model="form.source" class="field__input" maxlength="60" placeholder="在哪里遇见的" @input="markDirty" />
        </view>
        <view class="field field--half">
          <text class="field__label">日期</text>
          <picker mode="date" :value="form.tastedAt" @change="changeDate">
            <view class="field__picker">{{ form.tastedAt || '选填' }} <text>⌄</text></view>
          </picker>
        </view>
      </view>

      <view class="field">
        <text class="field__label">想说的话</text>
        <textarea v-model="form.note" class="field__textarea" maxlength="300" placeholder="想让老公复刻，或者下次还要再去…" @input="markDirty" />
      </view>

      <button class="save-button" :loading="saving" :disabled="saving" @tap="saveWish">{{ saving ? '正在收藏' : '替我记住它' }}</button>
      <button v-if="wishId" class="delete-button" @tap="deleteWish">删除这份心动</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.edit-page { min-height: 100vh; padding: 28rpx 24rpx calc(56rpx + env(safe-area-inset-bottom)); background: linear-gradient(150deg, #fff9f5, #ffdcd6); }
.page-state { padding-top: 260rpx; color: var(--muted); text-align: center; }
.form-card { padding: 46rpx 36rpx 52rpx; background: rgba(255,253,249,.95); border: 2rpx solid rgba(255,255,255,.9); border-radius: 38rpx 14rpx 38rpx 14rpx; box-shadow: 0 22rpx 52rpx var(--shadow); }
.form-heading { padding-bottom: 36rpx; border-bottom: 2rpx solid var(--line); }
.form-heading text { display: block; }
.form-heading__eyebrow { margin-bottom: 12rpx; color: var(--red); font-family: Georgia, serif; font-size: 17rpx; letter-spacing: 4rpx; }
.form-heading__title { font-family: 'Kaiti SC','STKaiti',serif; font-size: 52rpx; font-weight: 900; letter-spacing: 3rpx; }
.field { margin-top: 39rpx; }
.field-row { display: flex; gap: 18rpx; }
.field--half { flex: 1; min-width: 0; }
.field__label { display: block; margin-bottom: 15rpx; color: #704b55; font-size: 22rpx; font-weight: 700; letter-spacing: 2rpx; }
.field__input,.field__picker,.field__textarea { width: 100%; color: var(--ink); background: #fff1ed; border: 2rpx solid rgba(185,68,91,.12); border-radius: 22rpx 8rpx 22rpx 8rpx; font-size: 25rpx; }
.field__input,.field__picker { height: 82rpx; padding: 0 20rpx; line-height: 82rpx; }
.field__picker { display: flex; justify-content: space-between; font-size: 22rpx; }
.field__textarea { height: 220rpx; padding: 20rpx; line-height: 1.7; }
.field__row { display: flex; justify-content: space-between; }
.field__count { color: var(--muted); font-size: 20rpx; }
.status-options { display: flex; gap: 14rpx; }
.status-option { flex: 1; height: 72rpx; margin: 0; padding: 0; color: var(--muted); background: #fff1ed; border-radius: 36rpx 12rpx 36rpx 12rpx; font-size: 22rpx; line-height: 72rpx; }
.status-option--active { color: #fff; background: var(--ink); box-shadow: 0 10rpx 20rpx rgba(84,43,53,.2); }
.cover-upload { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260rpx; color: var(--red-dark); background: #fff1ed; border: 3rpx dashed rgba(185,68,91,.25); border-radius: 30rpx 10rpx 30rpx 10rpx; font-size: 23rpx; }
.cover-upload__plus { margin-bottom: 8rpx; font-size: 48rpx; font-weight: 300; }
.cover-preview { position: relative; height: 330rpx; overflow: hidden; border-radius: 30rpx 10rpx 30rpx 10rpx; }
.cover-preview__image { width: 100%; height: 100%; }
.cover-preview__action { position: absolute; right: 16rpx; bottom: 16rpx; padding: 10rpx 18rpx; color: #fff; background: rgba(84,43,53,.72); border-radius: 20rpx; font-size: 19rpx; }
.image-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12rpx; }
.image-tile,.image-add { position: relative; width: 100%; height: 170rpx; margin: 0; overflow: hidden; background: #fff1ed; border-radius: 22rpx 8rpx 22rpx 8rpx; }
.image-tile__image { width: 100%; height: 100%; }
.image-tile__remove { position: absolute; top: 6rpx; right: 6rpx; width: 42rpx; height: 42rpx; margin: 0; padding: 0; color: #fff; background: rgba(84,43,53,.76); border-radius: 50%; font-size: 28rpx; line-height: 39rpx; }
.image-add { color: var(--red); border: 2rpx dashed rgba(185,68,91,.26); font-size: 43rpx; line-height: 166rpx; }
.save-button { height: 92rpx; margin-top: 50rpx; color: #fff; background: linear-gradient(110deg,var(--red-dark),var(--red)); border-radius: 46rpx 15rpx 46rpx 15rpx; box-shadow: 0 17rpx 30rpx rgba(185,68,91,.24); font-size: 26rpx; font-weight: 700; letter-spacing: 3rpx; line-height: 92rpx; }
.delete-button { height: 76rpx; margin-top: 20rpx; color: var(--red-dark); background: transparent; font-size: 23rpx; line-height: 76rpx; }
</style>
