<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { formatShanghaiDate, validateDiningInvite } from '../../domain/dining.js'
import { repository } from '../../repositories/index.js'

const loading = ref(true)
const saving = ref(false)
const form = reactive({ theme: '', diningDate: formatShanghaiDate() })

async function loadPage() {
  try {
    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以发起点菜', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 300)
    }
  } catch (error) {
    uni.showToast({ title: error?.message || '页面加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function changeDate(event) {
  form.diningDate = event.detail.value
}

async function createInvite() {
  if (saving.value) return
  const validation = validateDiningInvite(form)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  saving.value = true
  try {
    const invite = await repository.createDiningInvite({
      theme: form.theme.trim(),
      diningDate: form.diningDate,
    })
    uni.showToast({ title: '邀请已经备好', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/dining-manage/index?id=${encodeURIComponent(invite.id)}` })
    }, 350)
  } catch (error) {
    uni.showToast({ title: error?.message || '创建失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad(loadPage)
</script>

<template>
  <view class="create-page">
    <view class="glow glow--one" />
    <view class="glow glow--two" />

    <view v-if="loading" class="page-state">正在铺好小菜馆的桌布…</view>
    <view v-else class="invite-paper">
      <view class="invite-paper__stamp">粤湘情</view>
      <view class="heading">
        <text class="heading__eyebrow">A TABLE FOR SOMEONE SPECIAL</text>
        <text class="heading__title">开一桌，等你来点</text>
        <text class="heading__copy">先定下相见的日子，再给这一餐起个只属于你们的名字。</text>
      </view>

      <view class="divider"><text>♡</text></view>

      <view class="field">
        <text class="field__label">聚餐主题</text>
        <input
          v-model="form.theme"
          class="field__input"
          maxlength="40"
          placeholder="例如：周末在家吃顿好的"
          placeholder-class="field__placeholder"
        />
        <text class="field__hint">这句话会出现在点菜人的邀请卡上</text>
      </view>

      <view class="field">
        <text class="field__label">就餐日期</text>
        <picker mode="date" :value="form.diningDate" @change="changeDate">
          <view class="date-ticket">
            <view>
              <text class="date-ticket__value">{{ form.diningDate }}</text>
              <text class="date-ticket__hint">当天结束前都可以点菜</text>
            </view>
            <text class="date-ticket__arrow">⌄</text>
          </view>
        </picker>
      </view>

      <button class="create-button" :loading="saving" :disabled="saving" @tap="createInvite">
        {{ saving ? '正在布置餐桌…' : '生成点菜邀请' }}
      </button>
      <text class="bottom-note">创建后，再亲手把菜单发给想邀请的人</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.create-page {
  position: relative;
  min-height: 100vh;
  padding: 34rpx 24rpx calc(58rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 253, 249, 0.96), rgba(255, 226, 220, 0.95)),
    #fff2ed;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(2rpx);
}

.glow--one { top: -120rpx; right: -100rpx; width: 360rpx; height: 360rpx; background: rgba(255, 187, 176, 0.28); }
.glow--two { bottom: 80rpx; left: -170rpx; width: 390rpx; height: 390rpx; background: rgba(232, 201, 140, 0.2); }

.page-state {
  position: relative;
  z-index: 1;
  padding-top: 280rpx;
  color: var(--muted);
  text-align: center;
}

.invite-paper {
  position: relative;
  z-index: 1;
  padding: 58rpx 42rpx 48rpx;
  overflow: hidden;
  background: rgba(255, 253, 249, 0.94);
  border: 2rpx solid rgba(119, 63, 77, 0.12);
  border-radius: 44rpx 16rpx 44rpx 16rpx;
  box-shadow: 0 30rpx 80rpx rgba(111, 50, 66, 0.17);
}

.invite-paper__stamp {
  position: absolute;
  top: 30rpx;
  right: -38rpx;
  width: 180rpx;
  padding: 9rpx 0;
  color: rgba(185, 68, 91, 0.56);
  border: 3rpx solid rgba(185, 68, 91, 0.28);
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 5rpx;
  text-align: center;
  transform: rotate(13deg);
}

.heading__eyebrow,
.heading__title,
.heading__copy { display: block; }

.heading__eyebrow {
  max-width: 450rpx;
  color: #b67a58;
  font-size: 17rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  line-height: 1.5;
}

.heading__title {
  margin-top: 18rpx;
  color: var(--ink);
  font-family: 'Kaiti SC', 'STKaiti', serif;
  font-size: 56rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.heading__copy {
  max-width: 530rpx;
  margin-top: 18rpx;
  color: #8a626b;
  font-size: 23rpx;
  line-height: 1.8;
}

.divider {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  color: var(--red);
  font-size: 25rpx;
}

.divider::before,
.divider::after {
  width: 42%;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(119, 63, 77, 0.16));
  content: '';
}

.divider::after { background: linear-gradient(90deg, rgba(119, 63, 77, 0.16), transparent); }
.divider text { margin: 0 16rpx; }

.field + .field { margin-top: 36rpx; }

.field__label {
  display: block;
  margin-bottom: 14rpx;
  color: #6a444e;
  font-size: 23rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.field__input,
.date-ticket {
  width: 100%;
  background: #fff3ee;
  border: 2rpx solid rgba(185, 68, 91, 0.12);
  border-radius: 24rpx 8rpx 24rpx 8rpx;
}

.field__input {
  height: 92rpx;
  padding: 0 24rpx;
  color: var(--ink);
  font-size: 28rpx;
}

.field__placeholder { color: #c29ba0; }

.field__hint {
  display: block;
  margin-top: 12rpx;
  color: #ad858c;
  font-size: 20rpx;
}

.date-ticket {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 112rpx;
  padding: 20rpx 24rpx;
}

.date-ticket__value,
.date-ticket__hint { display: block; }
.date-ticket__value { color: var(--ink); font-size: 31rpx; font-weight: 800; letter-spacing: 2rpx; }
.date-ticket__hint { margin-top: 7rpx; color: #ad858c; font-size: 19rpx; }
.date-ticket__arrow { color: var(--red-dark); font-size: 30rpx; }

.create-button {
  height: 92rpx;
  margin: 52rpx 0 0;
  color: #fffaf6;
  background: linear-gradient(110deg, #542b35, #91404e);
  border-radius: 46rpx 14rpx 46rpx 14rpx;
  box-shadow: 0 18rpx 34rpx rgba(84, 43, 53, 0.24);
  font-size: 27rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
  line-height: 92rpx;
}

.bottom-note {
  display: block;
  margin-top: 22rpx;
  color: #b28a91;
  font-size: 20rpx;
  text-align: center;
}
</style>
