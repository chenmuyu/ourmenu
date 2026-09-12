<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { addManagedOption, moveManagedOption, toggleManagedOption } from '../../domain/kitchen.js'
import { repository } from '../../repositories/index.js'
import { chooseImages, uploadForCurrentMode } from '../../services/imageService.js'

const kitchen = ref({ name: '粤湘情', backgroundUrl: '', members: [], groups: [], tags: [] })
const newGroupName = ref('')
const newTagName = ref('')
const saving = ref(false)
const loading = ref(true)

async function loadPage() {
  loading.value = true
  try {
    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以打开小家设置', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 300)
      return
    }
    const current = await repository.getKitchen()
    kitchen.value = {
      ...current,
      members: current.members.map((member) => ({ ...member })),
      groups: current.groups.map((item) => ({ ...item })),
      tags: current.tags.map((item) => ({ ...item })),
    }
  } catch (error) {
    uni.showToast({ title: error?.message || '设置加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function chooseAndUpload() {
  const [path] = await chooseImages(1)
  return uploadForCurrentMode(path)
}

async function chooseAvatar(index) {
  try {
    const result = await chooseAndUpload()
    if (result.url) kitchen.value.members[index].avatarUrl = result.url
    if (result.pending) uni.showToast({ title: '头像暂存本机，请稍后重新上传', icon: 'none' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择头像失败', icon: 'none' })
  }
}

async function chooseBackground() {
  try {
    const result = await chooseAndUpload()
    if (result.url) kitchen.value.backgroundUrl = result.url
    if (result.pending) uni.showToast({ title: '底图暂存本机，请稍后重新上传', icon: 'none' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择底图失败', icon: 'none' })
  }
}

function resetBackground() {
  kitchen.value.backgroundUrl = ''
}

function addOption(type) {
  const isGroup = type === 'group'
  const nameRef = isGroup ? newGroupName : newTagName
  const key = isGroup ? 'groups' : 'tags'
  try {
    kitchen.value[key] = addManagedOption(kitchen.value[key], nameRef.value, type)
    nameRef.value = ''
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'none' })
  }
}

function moveOption(type, index, direction) {
  const key = type === 'group' ? 'groups' : 'tags'
  kitchen.value[key] = moveManagedOption(kitchen.value[key], index, direction)
}

function toggleOption(type, id) {
  const key = type === 'group' ? 'groups' : 'tags'
  kitchen.value[key] = toggleManagedOption(kitchen.value[key], id)
}

function optionsAreValid(items) {
  const names = items.map((item) => item.name.trim()).filter(Boolean)
  return names.length === items.length && new Set(names).size === names.length
}

async function saveSettings() {
  if (kitchen.value.members.some((member) => !member.name.trim())) {
    uni.showToast({ title: '请填写两个人的名字', icon: 'none' })
    return
  }
  if (!optionsAreValid(kitchen.value.groups) || !optionsAreValid(kitchen.value.tags)) {
    uni.showToast({ title: '分类和标签不能留空或重名', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await repository.saveKitchen(kitchen.value)
    uni.showToast({ title: '小家已经布置好啦', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 350)
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad(loadPage)
</script>

<template>
  <view class="settings-page">
    <view v-if="loading" class="page-state">正在打开小家设置…</view>
    <template v-else>
      <view class="settings-hero">
        <text class="settings-hero__eyebrow">MAKE OUR LITTLE HOME</text>
        <text class="settings-hero__title">小家设置</text>
        <text class="settings-hero__copy">把两个人、喜欢的分类和每天看见的风景，都放在这里。</text>
      </view>

      <view class="setting-section">
        <view class="section-heading"><text class="section-heading__number">01</text><view><text class="section-heading__title">我们两个人</text><text class="section-heading__copy">头像、名字与当前绑定状态</text></view></view>
        <view v-for="(member, index) in kitchen.members" :key="member.id" class="profile-card">
          <button class="avatar-button" @tap="chooseAvatar(index)">
            <image v-if="member.avatarUrl" class="avatar-button__image" :src="member.avatarUrl" mode="aspectFill" />
            <view v-else class="avatar-button__image avatar-button__fallback">{{ member.name.slice(0, 1) || '我' }}</view>
            <text class="avatar-button__hint">换头像</text>
          </button>
          <view class="profile-card__body">
            <input v-model="member.name" class="profile-input" maxlength="8" placeholder="填写名字" />
            <view class="bound-status" :class="{ 'bound-status--yes': member.bound }">
              <view class="bound-status__dot" />{{ member.bound ? '微信已绑定' : '等待家庭成员绑定' }}
            </view>
          </view>
        </view>
        <text class="section-footnote">为避免误操作，小程序内不提供解绑；换手机时在云数据库中处理。</text>
      </view>

      <view class="setting-section">
        <view class="section-heading"><text class="section-heading__number">02</text><view><text class="section-heading__title">页面装扮</text><text class="section-heading__copy">两个主页面共用一张底图</text></view></view>
        <view class="background-preview" @tap="chooseBackground">
          <image v-if="kitchen.backgroundUrl" class="background-preview__image" :src="kitchen.backgroundUrl" mode="aspectFill" />
          <view v-else class="background-preview__default"><view class="preview-bubble preview-bubble--one"/><view class="preview-bubble preview-bubble--two"/><text>奶油泡泡默认底图</text></view>
          <view class="background-preview__caption">{{ kitchen.backgroundUrl ? '点击更换底图' : '点击上传自己的底图' }}</view>
        </view>
        <button v-if="kitchen.backgroundUrl" class="text-button" @tap="resetBackground">恢复默认底图</button>
      </view>

      <view class="setting-section">
        <view class="section-heading"><text class="section-heading__number">03</text><view><text class="section-heading__title">食材分组</text><text class="section-heading__copy">首页公共筛选，停用后历史菜谱仍保留</text></view></view>
        <view class="option-list">
          <view v-for="(group, index) in kitchen.groups" :key="group.id" class="option-row" :class="{ 'option-row--disabled': !group.active }">
            <input v-model="group.name" class="option-row__input" maxlength="10" />
            <button class="mini-button" :disabled="index === 0" @tap="moveOption('group', index, -1)">↑</button>
            <button class="mini-button" :disabled="index === kitchen.groups.length - 1" @tap="moveOption('group', index, 1)">↓</button>
            <button class="toggle-button" @tap="toggleOption('group', group.id)">{{ group.active ? '使用中' : '已停用' }}</button>
          </view>
        </view>
        <view class="add-option"><input v-model="newGroupName" maxlength="10" placeholder="新增分组名称" /><button @tap="addOption('group')">＋ 添加</button></view>
      </view>

      <view class="setting-section">
        <view class="section-heading"><text class="section-heading__number">04</text><view><text class="section-heading__title">菜品标签</text><text class="section-heading__copy">菜谱可以同时选择多个标签</text></view></view>
        <view class="option-list">
          <view v-for="(tag, index) in kitchen.tags" :key="tag.id" class="option-row" :class="{ 'option-row--disabled': !tag.active }">
            <input v-model="tag.name" class="option-row__input" maxlength="12" />
            <button class="mini-button" :disabled="index === 0" @tap="moveOption('tag', index, -1)">↑</button>
            <button class="mini-button" :disabled="index === kitchen.tags.length - 1" @tap="moveOption('tag', index, 1)">↓</button>
            <button class="toggle-button" @tap="toggleOption('tag', tag.id)">{{ tag.active ? '使用中' : '已停用' }}</button>
          </view>
        </view>
        <view class="add-option"><input v-model="newTagName" maxlength="12" placeholder="新增标签名称" /><button @tap="addOption('tag')">＋ 添加</button></view>
      </view>

      <button class="save-button" :loading="saving" :disabled="saving" @tap="saveSettings">{{ saving ? '正在保存' : '保存小家设置' }}</button>
    </template>
  </view>
</template>

<style scoped lang="scss">
.settings-page { min-height: 100vh; padding: 34rpx 26rpx calc(70rpx + env(safe-area-inset-bottom)); background: linear-gradient(155deg,#fffdf9,#ffe1db); }
.page-state { padding-top: 260rpx; color: var(--muted); text-align: center; }
.settings-hero { padding: 20rpx 12rpx 44rpx; }.settings-hero text { display: block; }
.settings-hero__eyebrow { margin-bottom: 12rpx; color: var(--red); font-family: Georgia,serif; font-size: 17rpx; letter-spacing: 4rpx; }
.settings-hero__title { font-family: 'Kaiti SC','STKaiti',serif; font-size: 70rpx; font-weight: 900; letter-spacing: 4rpx; text-shadow: 6rpx 7rpx 0 rgba(232,201,140,.42); }
.settings-hero__copy { margin-top: 18rpx; color: var(--muted); font-size: 23rpx; line-height: 1.7; }
.setting-section { margin-bottom: 26rpx; padding: 30rpx 26rpx; background: rgba(255,253,249,.92); border: 2rpx solid rgba(255,255,255,.9); border-radius: 34rpx 12rpx 34rpx 12rpx; box-shadow: 0 16rpx 34rpx rgba(111,50,66,.1); }
.section-heading { display: flex; align-items: center; margin-bottom: 28rpx; }.section-heading__number { margin-right: 18rpx; color: var(--red); font-family: Georgia,serif; font-size: 20rpx; }.section-heading__title,.section-heading__copy { display: block; }.section-heading__title { font-family: 'Kaiti SC','STKaiti',serif; font-size: 34rpx; font-weight: 900; }.section-heading__copy { margin-top: 5rpx; color: var(--muted); font-size: 19rpx; }
.profile-card { display: flex; align-items: center; margin-bottom: 18rpx; padding: 20rpx; background: #fff1ed; border-radius: 28rpx 10rpx 28rpx 10rpx; }
.avatar-button { position: relative; width: 110rpx; height: 130rpx; margin: 0 22rpx 0 0; padding: 0; overflow: visible; background: transparent; line-height: 1; }.avatar-button__image { display: flex; align-items: center; justify-content: center; width: 100rpx; height: 100rpx; border: 4rpx solid #fff; border-radius: 50%; box-shadow: 0 8rpx 18rpx rgba(111,50,66,.14); }.avatar-button__fallback { color: #fff; background: var(--red); font-size: 34rpx; font-weight: 900; }.avatar-button__hint { position: absolute; bottom: 0; left: 14rpx; color: var(--muted); font-size: 18rpx; }
.profile-card__body { flex: 1; }.profile-input { height: 68rpx; padding: 0 18rpx; color: var(--ink); background: #fff; border-radius: 19rpx 7rpx 19rpx 7rpx; font-size: 27rpx; font-weight: 700; }
.bound-status { display: flex; align-items: center; margin-top: 12rpx; color: var(--muted); font-size: 18rpx; }.bound-status__dot { width: 12rpx; height: 12rpx; margin-right: 8rpx; background: var(--gold); border-radius: 50%; }.bound-status--yes .bound-status__dot { background: #60a875; }
.section-footnote { display: block; margin-top: 18rpx; color: var(--muted); font-size: 18rpx; line-height: 1.6; }
.background-preview { position: relative; height: 320rpx; overflow: hidden; background: #ffe6e0; border: 3rpx dashed rgba(185,68,91,.22); border-radius: 30rpx 10rpx 30rpx 10rpx; }.background-preview__image { width: 100%; height: 100%; }.background-preview__default { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--muted); background: linear-gradient(145deg,#fffaf7,#ffdcd6); font-size: 22rpx; }.background-preview__caption { position: absolute; right: 18rpx; bottom: 18rpx; padding: 11rpx 18rpx; color: #fff; background: rgba(84,43,53,.74); border-radius: 22rpx; font-size: 18rpx; }.preview-bubble { position: absolute; border: 2rpx solid rgba(255,255,255,.8); border-radius: 50%; }.preview-bubble--one { top: 28rpx; right: 45rpx; width: 90rpx; height: 90rpx; }.preview-bubble--two { bottom: 30rpx; left: 38rpx; width: 60rpx; height: 60rpx; }
.text-button { height: 66rpx; margin-top: 12rpx; color: var(--red-dark); background: transparent; font-size: 20rpx; line-height: 66rpx; }
.option-row { display: flex; align-items: center; gap: 8rpx; margin-bottom: 11rpx; padding: 11rpx; background: #fff2ee; border-radius: 20rpx 7rpx 20rpx 7rpx; }.option-row--disabled { opacity: .5; }.option-row__input { flex: 1; min-width: 0; height: 58rpx; padding: 0 12rpx; color: var(--ink); background: #fff; border-radius: 14rpx 5rpx 14rpx 5rpx; font-size: 22rpx; }
.mini-button { width: 52rpx; height: 52rpx; margin: 0; padding: 0; color: var(--ink); background: #fff; border-radius: 50%; font-size: 23rpx; line-height: 52rpx; }.toggle-button { width: 96rpx; height: 52rpx; margin: 0; padding: 0; color: var(--red-dark); background: transparent; font-size: 18rpx; line-height: 52rpx; }
.add-option { display: flex; gap: 10rpx; margin-top: 20rpx; }.add-option input { flex: 1; height: 70rpx; padding: 0 18rpx; background: #fff; border: 2rpx solid rgba(185,68,91,.12); border-radius: 20rpx 7rpx 20rpx 7rpx; font-size: 22rpx; }.add-option button { width: 150rpx; height: 70rpx; margin: 0; padding: 0; color: #fff; background: var(--ink); border-radius: 35rpx 10rpx 35rpx 10rpx; font-size: 21rpx; line-height: 70rpx; }
.save-button { height: 94rpx; margin-top: 35rpx; color: #fff; background: linear-gradient(110deg,var(--red-dark),var(--red)); border-radius: 47rpx 15rpx 47rpx 15rpx; box-shadow: 0 18rpx 34rpx rgba(185,68,91,.26); font-size: 27rpx; font-weight: 700; letter-spacing: 3rpx; line-height: 94rpx; }
</style>
