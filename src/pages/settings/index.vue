<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { repository } from '../../repositories/index.js'
import { chooseImages, uploadForCurrentMode } from '../../services/imageService.js'

const kitchen = ref({ name: '两人菜单', members: [] })
const saving = ref(false)

async function loadPage() {
  try {
    const current = await repository.getKitchen()
    kitchen.value = {
      ...current,
      members: current.members.map((member) => ({ ...member })),
    }
  } catch (error) {
    uni.showToast({ title: error?.message || '资料加载失败', icon: 'none' })
  }
}

async function chooseAvatar(index) {
  try {
    const [path] = await chooseImages(1)
    const result = await uploadForCurrentMode(path)
    if (result.url) kitchen.value.members[index].avatarUrl = result.url
    if (result.pending) uni.showToast({ title: '头像暂存本机，请稍后重新上传', icon: 'none' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择头像失败', icon: 'none' })
  }
}

async function saveProfiles() {
  if (kitchen.value.members.some((member) => !member.name.trim())) {
    uni.showToast({ title: '请填写两个人的名字', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await repository.saveKitchen(kitchen.value)
    uni.showToast({ title: '资料已更新', icon: 'success' })
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
    <view class="settings-intro">
      <text class="settings-intro__eyebrow">ONLY FOR TWO</text>
      <text class="settings-intro__title">我们两个人</text>
      <text class="settings-intro__copy">固定两位掌勺人，各自上传头像和修改名字。</text>
    </view>

    <view v-for="(member, index) in kitchen.members" :key="member.id" class="profile-card">
      <text class="profile-card__number">0{{ index + 1 }}</text>
      <button class="avatar-button" @tap="chooseAvatar(index)">
        <image v-if="member.avatarUrl" class="avatar-button__image" :src="member.avatarUrl" mode="aspectFill" />
        <view v-else class="avatar-button__fallback">{{ member.name.slice(0, 1) || '我' }}</view>
        <text class="avatar-button__hint">更换头像</text>
      </button>
      <view class="profile-card__field">
        <text class="profile-card__label">掌勺人名字</text>
        <input v-model="member.name" class="profile-card__input" maxlength="8" placeholder="填写名字" />
      </view>
    </view>

    <view class="kitchen-name-field">
      <text class="profile-card__label">菜单册名称</text>
      <input v-model="kitchen.name" class="profile-card__input" maxlength="12" placeholder="两人菜单" />
    </view>

    <button class="save-button" :loading="saving" :disabled="saving" @tap="saveProfiles">保存两人资料</button>
  </view>
</template>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding: 46rpx 28rpx calc(70rpx + env(safe-area-inset-bottom));
  background: linear-gradient(155deg, #f1e9da 0%, #e7dac4 100%);
}

.settings-intro {
  padding: 10rpx 14rpx 46rpx;
}

.settings-intro__eyebrow,
.settings-intro__title,
.settings-intro__copy {
  display: block;
}

.settings-intro__eyebrow {
  margin-bottom: 12rpx;
  color: var(--red);
  font-family: Georgia, serif;
  font-size: 18rpx;
  letter-spacing: 5rpx;
}

.settings-intro__title {
  font-family: 'STSong', 'Songti SC', serif;
  font-size: 48rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
}

.settings-intro__copy {
  margin-top: 16rpx;
  color: var(--muted);
  font-size: 24rpx;
  line-height: 1.7;
}

.profile-card {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 34rpx 30rpx;
  overflow: hidden;
  background: var(--paper);
  border: 2rpx solid rgba(74, 55, 40, 0.16);
  border-radius: 20rpx;
  box-shadow: 0 12rpx 30rpx rgba(74, 56, 36, 0.1);
}

.profile-card__number {
  position: absolute;
  top: -18rpx;
  right: 14rpx;
  color: rgba(185, 65, 52, 0.08);
  font-family: Georgia, serif;
  font-size: 120rpx;
  font-weight: 700;
}

.avatar-button {
  position: relative;
  flex: 0 0 auto;
  width: 132rpx;
  height: 154rpx;
  margin: 0 30rpx 0 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  line-height: 1;
}

.avatar-button__image,
.avatar-button__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border: 4rpx solid #eadcc5;
  border-radius: 50%;
}

.avatar-button__fallback {
  color: #fffaf0;
  background: var(--red);
  font-size: 42rpx;
  font-weight: 700;
}

.profile-card:nth-of-type(3) .avatar-button__fallback {
  background: var(--green);
}

.avatar-button__hint {
  position: absolute;
  bottom: 0;
  left: 10rpx;
  color: var(--muted);
  font-size: 20rpx;
}

.profile-card__field {
  position: relative;
  z-index: 1;
  flex: 1;
}

.profile-card__label {
  display: block;
  margin-bottom: 14rpx;
  color: var(--muted);
  font-size: 21rpx;
  letter-spacing: 2rpx;
}

.profile-card__input {
  width: 100%;
  height: 78rpx;
  padding: 0 20rpx;
  color: var(--ink);
  background: #f7efdf;
  border: 2rpx solid rgba(74, 55, 40, 0.12);
  border-radius: 8rpx;
  font-size: 29rpx;
}

.kitchen-name-field {
  margin: 38rpx 8rpx;
}

.save-button {
  height: 92rpx;
  margin-top: 40rpx;
  color: #fffaf0;
  background: var(--ink);
  border-radius: 10rpx;
  font-size: 27rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  line-height: 92rpx;
}
</style>
