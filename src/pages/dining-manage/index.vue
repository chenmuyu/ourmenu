<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { loadAccess } from '../../access/session.js'
import { normalizeCustomDishNames, validateDiningInvite, validateDiningOrder } from '../../domain/dining.js'
import { repository } from '../../repositories/index.js'
import { chooseImages, mergeImagePaths, uploadForCurrentMode } from '../../services/imageService.js'

const inviteId = ref('')
const invite = ref(null)
const orders = ref([])
const form = reactive({ theme: '', diningDate: '', imageUrls: [] })
const loading = ref(true)
const savingInvite = ref(false)
const savingOrderId = ref('')
const uploading = ref(false)
const errorMessage = ref('')

const dishCount = computed(() =>
  orders.value.reduce(
    (total, order) => total + (order.menuItems || []).length + (order.customDishNames || []).length,
    0,
  ),
)

function hydrateOrder(order) {
  return {
    ...order,
    menuItems: (order.menuItems || []).map((item) => ({ ...item })),
    customDishNames: normalizeCustomDishNames(order.customDishNames),
    draftDish: '',
  }
}

async function loadPage(options = {}) {
  loading.value = true
  errorMessage.value = ''
  try {
    inviteId.value = decodeURIComponent(options.id || inviteId.value || '')
    if (!inviteId.value) throw new Error('点菜邀请不存在')

    const access = await loadAccess(repository)
    if (access.role !== 'family') {
      uni.showToast({ title: '只有家庭成员可以管理这桌点菜', icon: 'none' })
      setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 300)
      return
    }

    const [nextInvite, nextOrders] = await Promise.all([
      repository.getDiningInvite(inviteId.value),
      repository.listDiningOrders(inviteId.value),
    ])
    if (!nextInvite) throw new Error('点菜邀请不存在')

    invite.value = nextInvite
    form.theme = nextInvite.theme
    form.diningDate = nextInvite.diningDate
    form.imageUrls = [...(nextInvite.imageUrls || [])]
    orders.value = nextOrders.map(hydrateOrder)
  } catch (error) {
    errorMessage.value = error?.message || '聚餐详情加载失败'
  } finally {
    loading.value = false
  }
}

function changeDate(event) {
  form.diningDate = event.detail.value
}

async function saveInvite() {
  if (savingInvite.value) return
  const validation = validateDiningInvite(form)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  savingInvite.value = true
  try {
    const saved = await repository.saveDiningInvite({
      id: inviteId.value,
      theme: form.theme,
      diningDate: form.diningDate,
      imageUrls: form.imageUrls,
    })
    invite.value = saved
    form.theme = saved.theme
    form.diningDate = saved.diningDate
    form.imageUrls = [...(saved.imageUrls || [])]
    uni.showToast({ title: '这一桌已经保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    savingInvite.value = false
  }
}

async function addDiningImages() {
  if (uploading.value || form.imageUrls.length >= 9) return
  try {
    const paths = await chooseImages(9 - form.imageUrls.length)
    uploading.value = true
    let hasPendingImage = false
    const uploaded = []
    for (const path of paths) {
      const result = await uploadForCurrentMode(path)
      if (result.url) uploaded.push(result.url)
      if (result.pending) hasPendingImage = true
    }
    form.imageUrls = mergeImagePaths(form.imageUrls, uploaded, 9)
    if (hasPendingImage) uni.showToast({ title: '部分图片暂存在本机，保存后请稍后重试', icon: 'none' })
  } catch (error) {
    if (!String(error?.errMsg || '').includes('cancel')) {
      uni.showToast({ title: error?.message || '选择图片失败', icon: 'none' })
    }
  } finally {
    uploading.value = false
  }
}

function previewImage(index) {
  uni.previewImage({ current: form.imageUrls[index], urls: form.imageUrls })
}

function removeImage(index) {
  form.imageUrls.splice(index, 1)
}

function addOrderDish(order) {
  const name = String(order.draftDish || '').trim()
  if (!name) return
  const next = normalizeCustomDishNames([...(order.customDishNames || []), name])
  if (next.length === order.customDishNames.length) {
    uni.showToast({ title: next.length >= 12 ? '最多添加 12 道菜单外菜品' : '这道菜已经有啦', icon: 'none' })
    return
  }
  order.customDishNames = next
  order.draftDish = ''
}

function removeOrderDish(order, index) {
  order.customDishNames.splice(index, 1)
}

async function saveOrder(order) {
  if (savingOrderId.value) return
  addOrderDish(order)
  const validation = validateDiningOrder(order)
  if (!validation.valid) {
    uni.showToast({ title: validation.message, icon: 'none' })
    return
  }

  savingOrderId.value = order.id
  try {
    const saved = await repository.saveDiningOrder(inviteId.value, {
      id: order.id,
      participantName: order.participantName,
      customDishNames: order.customDishNames,
    })
    const index = orders.value.findIndex((item) => item.id === saved.id)
    if (index >= 0) orders.value.splice(index, 1, hydrateOrder(saved))
    uni.showToast({ title: '点菜单已更新', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || '点菜单保存失败', icon: 'none' })
  } finally {
    savingOrderId.value = ''
  }
}

onLoad(loadPage)
onShareAppMessage(() => ({
  title: '欢迎来到粤湘情小菜馆',
  path: `/pages/dining-order/index?id=${encodeURIComponent(inviteId.value)}`,
}))
</script>

<template>
  <view class="manage-page">
    <view class="ambient ambient--one" />
    <view class="ambient ambient--two">♡</view>

    <view v-if="loading" class="page-state">正在翻开这一桌的点菜簿…</view>
    <view v-else-if="errorMessage" class="page-state page-state--error" @tap="loadPage()">
      {{ errorMessage }}，点此重试
    </view>
    <view v-else-if="!invite" class="page-state">正在返回菜谱页…</view>

    <template v-else>
      <view class="manage-hero">
        <text class="manage-hero__eyebrow">TABLE NOTES · 粤湘情小菜馆</text>
        <text class="manage-hero__title">这一桌，慢慢期待</text>
        <view class="manage-hero__summary">
          <text>{{ orders.length }} 人回应</text>
          <text>·</text>
          <text>共 {{ dishCount }} 道心意</text>
        </view>
      </view>

      <view class="paper-card invite-card">
        <view class="section-heading">
          <view>
            <text class="section-heading__eyebrow">INVITATION</text>
            <text class="section-heading__title">邀请设置</text>
          </view>
          <text class="status-seal" :class="{ 'status-seal--closed': invite.status !== 'open' }">
            {{ invite.status === 'open' ? '正在点菜' : '已经开席' }}
          </text>
        </view>

        <view class="field">
          <text class="field__label">聚餐主题</text>
          <input v-model="form.theme" maxlength="40" placeholder="给这一餐起个名字" />
        </view>
        <view class="field">
          <text class="field__label">就餐日期</text>
          <picker mode="date" :value="form.diningDate" @change="changeDate">
            <view class="date-field"><text>{{ form.diningDate }}</text><text>⌄</text></view>
          </picker>
        </view>

        <view class="gallery-heading">
          <view>
            <text class="field__label">这一餐的照片</text>
            <text class="gallery-heading__copy">选填，最多 9 张，开席后也能继续补上回忆</text>
          </view>
          <text>{{ form.imageUrls.length }}/9</text>
        </view>
        <view class="photo-grid">
          <view v-for="(url, index) in form.imageUrls" :key="url" class="photo-item">
            <image :src="url" mode="aspectFill" @tap="previewImage(index)" />
            <button aria-label="删除图片" @tap.stop="removeImage(index)">×</button>
          </view>
          <button v-if="form.imageUrls.length < 9" class="photo-add" :disabled="uploading" @tap="addDiningImages">
            <text class="photo-add__mark">＋</text>
            <text>{{ uploading ? '上传中' : '添加照片' }}</text>
          </button>
        </view>

        <view class="invite-actions">
          <button class="save-button" :loading="savingInvite" :disabled="savingInvite" @tap="saveInvite">保存这一桌</button>
          <button class="share-button" open-type="share">分享点菜邀请</button>
        </view>
      </view>

      <view class="orders-heading">
        <text class="orders-heading__eyebrow">GUEST ORDERS</text>
        <text class="orders-heading__title">大家想吃的</text>
      </view>

      <view v-if="!orders.length" class="empty-order">
        <text>菜单已经递出去啦</text>
        <text>等第一份点菜心意到来。</text>
      </view>

      <view v-for="(order, orderIndex) in orders" v-else :key="order.id" class="paper-card order-card">
        <view class="order-card__number">{{ String(orderIndex + 1).padStart(2, '0') }}</view>
        <view class="order-name">
          <text>点菜人</text>
          <input v-model="order.participantName" maxlength="20" placeholder="客人" />
        </view>

        <view v-if="order.menuItems.length" class="dish-block">
          <text class="dish-block__label">从菜谱选中</text>
          <view v-for="item in order.menuItems" :key="item.id" class="menu-dish">
            <image v-if="item.thumbnailUrl" :src="item.thumbnailUrl" mode="aspectFill" />
            <view v-else class="menu-dish__fallback">{{ item.name.slice(0, 1) }}</view>
            <view class="menu-dish__copy">
              <text>{{ item.name }}</text>
              <text>{{ item.cookName ? `${item.cookName} 掌勺` : '家里掌勺人' }}</text>
            </view>
          </view>
        </view>

        <view class="dish-block">
          <text class="dish-block__label">菜单外的小心愿</text>
          <view v-if="order.customDishNames.length" class="custom-dishes">
            <button v-for="(name, index) in order.customDishNames" :key="name" @tap="removeOrderDish(order, index)">
              {{ name }} <text>×</text>
            </button>
          </view>
          <view class="custom-input">
            <input v-model="order.draftDish" maxlength="30" confirm-type="done" placeholder="补充一道菜名" @confirm="addOrderDish(order)" />
            <button @tap="addOrderDish(order)">添加</button>
          </view>
        </view>

        <button
          class="order-save"
          :loading="savingOrderId === order.id"
          :disabled="Boolean(savingOrderId)"
          @tap="saveOrder(order)"
        >
          保存这份点菜单
        </button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.manage-page {
  position: relative;
  min-height: 100vh;
  padding: 34rpx 26rpx calc(76rpx + env(safe-area-inset-bottom));
  overflow: hidden;
  background:
    radial-gradient(circle at 96% 2%, rgba(255, 190, 179, 0.46), transparent 25%),
    linear-gradient(158deg, #fffdf9 0%, #fff1ed 56%, #ffddd7 100%);
}

.ambient { position: absolute; z-index: 0; border-radius: 50%; }
.ambient--one { top: 330rpx; right: -120rpx; width: 280rpx; height: 280rpx; border: 3rpx solid rgba(255, 255, 255, 0.6); }
.ambient--two { top: 92rpx; right: 34rpx; color: rgba(185, 68, 91, 0.17); font-size: 90rpx; transform: rotate(15deg); }

.page-state { position: relative; z-index: 1; padding-top: 280rpx; color: var(--muted); text-align: center; }
.page-state--error { padding: 100rpx 30rpx; background: rgba(255, 253, 249, 0.85); border-radius: 34rpx; }

.manage-hero { position: relative; z-index: 1; padding: 20rpx 12rpx 38rpx; }
.manage-hero text { display: block; }
.manage-hero__eyebrow { color: #b67a58; font-size: 17rpx; font-weight: 800; letter-spacing: 4rpx; }
.manage-hero__title { margin-top: 14rpx; color: var(--ink); font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 54rpx; font-weight: 900; }
.manage-hero__summary { display: flex; gap: 12rpx; margin-top: 13rpx; color: #916b73; font-size: 21rpx; }

.paper-card { position: relative; z-index: 1; background: rgba(255, 253, 249, 0.94); border: 2rpx solid rgba(119, 63, 77, 0.1); border-radius: 38rpx 14rpx 38rpx 14rpx; box-shadow: 0 20rpx 52rpx rgba(111, 50, 66, 0.12); }
.invite-card { padding: 32rpx 28rpx 30rpx; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28rpx; }
.section-heading__eyebrow, .section-heading__title { display: block; }
.section-heading__eyebrow { color: #b67a58; font-family: Georgia, serif; font-size: 16rpx; letter-spacing: 4rpx; }
.section-heading__title { margin-top: 7rpx; font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 36rpx; font-weight: 900; }
.status-seal { padding: 9rpx 16rpx; color: #fff; background: var(--red-dark); border-radius: 20rpx; font-size: 18rpx; }
.status-seal--closed { color: #80656a; background: #f1e4df; }

.field + .field { margin-top: 22rpx; }
.field__label { display: block; margin-bottom: 10rpx; color: #6a444e; font-size: 21rpx; font-weight: 800; }
.field input, .date-field { height: 78rpx; padding: 0 20rpx; color: var(--ink); background: #fff2ee; border: 2rpx solid rgba(185, 68, 91, 0.1); border-radius: 21rpx 7rpx 21rpx 7rpx; font-size: 25rpx; }
.date-field { display: flex; align-items: center; justify-content: space-between; }

.gallery-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 28rpx; color: #a67c83; font-size: 19rpx; }
.gallery-heading__copy { display: block; margin-top: 6rpx; font-size: 18rpx; }
.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; margin-top: 16rpx; }
.photo-item, .photo-add { position: relative; height: 180rpx; margin: 0; overflow: hidden; border-radius: 24rpx 8rpx 24rpx 8rpx; }
.photo-item image { width: 100%; height: 100%; }
.photo-item button { position: absolute; top: 8rpx; right: 8rpx; width: 42rpx; height: 42rpx; margin: 0; padding: 0; color: #fff; background: rgba(62, 37, 43, 0.72); border-radius: 50%; font-size: 26rpx; line-height: 40rpx; }
.photo-add { display: flex; align-items: center; justify-content: center; flex-direction: column; color: #9b747b; background: #fff2ee; border: 2rpx dashed rgba(185, 68, 91, 0.25); font-size: 18rpx; line-height: 1.3; }
.photo-add__mark { margin-bottom: 8rpx; color: var(--red); font-size: 42rpx; font-weight: 300; }

.invite-actions { display: flex; gap: 14rpx; margin-top: 28rpx; }
.invite-actions button { flex: 1; height: 76rpx; margin: 0; padding: 0; border-radius: 38rpx 11rpx 38rpx 11rpx; font-size: 22rpx; font-weight: 800; line-height: 76rpx; }
.save-button { color: #fff; background: linear-gradient(110deg, #542b35, #91404e); box-shadow: 0 12rpx 26rpx rgba(84, 43, 53, 0.19); }
.share-button { color: var(--red-dark); background: #ffe5df; }

.orders-heading { position: relative; z-index: 1; margin: 46rpx 12rpx 20rpx; }
.orders-heading text { display: block; }
.orders-heading__eyebrow { color: #b67a58; font-size: 16rpx; font-weight: 800; letter-spacing: 4rpx; }
.orders-heading__title { margin-top: 7rpx; font-family: 'Kaiti SC', 'STKaiti', serif; font-size: 40rpx; font-weight: 900; }
.empty-order { position: relative; z-index: 1; display: flex; align-items: center; flex-direction: column; gap: 10rpx; padding: 84rpx 20rpx; color: #99757c; background: rgba(255, 253, 249, 0.76); border-radius: 32rpx 11rpx 32rpx 11rpx; font-size: 22rpx; }

.order-card { margin-bottom: 22rpx; padding: 28rpx 26rpx; overflow: hidden; }
.order-card__number { position: absolute; top: -16rpx; right: 18rpx; color: rgba(185, 68, 91, 0.09); font-family: Georgia, serif; font-size: 106rpx; font-weight: 900; line-height: 1; }
.order-name { position: relative; display: flex; align-items: center; gap: 16rpx; padding-bottom: 20rpx; border-bottom: 2rpx solid rgba(119, 63, 77, 0.09); }
.order-name > text { flex: 0 0 auto; color: #9a747b; font-size: 20rpx; }
.order-name input { position: relative; z-index: 1; flex: 1; height: 64rpx; padding: 0 16rpx; color: var(--ink); background: #fff2ee; border-radius: 18rpx 6rpx 18rpx 6rpx; font-size: 25rpx; font-weight: 800; }
.dish-block { margin-top: 24rpx; }
.dish-block__label { display: block; margin-bottom: 13rpx; color: #a07880; font-size: 19rpx; font-weight: 700; letter-spacing: 1rpx; }
.menu-dish { display: flex; align-items: center; margin-bottom: 11rpx; padding: 11rpx; background: #fff4f0; border-radius: 20rpx 7rpx 20rpx 7rpx; }
.menu-dish image, .menu-dish__fallback { display: flex; align-items: center; justify-content: center; width: 74rpx; height: 74rpx; margin-right: 15rpx; color: #fff; background: var(--red); border-radius: 50%; font-size: 25rpx; font-weight: 800; }
.menu-dish__copy { flex: 1; min-width: 0; }
.menu-dish__copy text { display: block; }
.menu-dish__copy text:first-child { overflow: hidden; color: var(--ink); font-size: 24rpx; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.menu-dish__copy text:last-child { margin-top: 5rpx; color: #aa858b; font-size: 18rpx; }
.custom-dishes { display: flex; flex-wrap: wrap; gap: 10rpx; }
.custom-dishes button { width: auto; height: 58rpx; margin: 0; padding: 0 17rpx; color: var(--red-dark); background: #ffe6df; border-radius: 29rpx 9rpx 29rpx 9rpx; font-size: 20rpx; line-height: 58rpx; }
.custom-dishes button text { margin-left: 6rpx; color: #ba7c87; }
.custom-input { display: flex; gap: 10rpx; margin-top: 13rpx; }
.custom-input input { flex: 1; height: 66rpx; padding: 0 16rpx; background: #fff7f4; border: 2rpx solid rgba(185, 68, 91, 0.11); border-radius: 18rpx 6rpx 18rpx 6rpx; font-size: 21rpx; }
.custom-input button { width: 112rpx; height: 66rpx; margin: 0; padding: 0; color: #fff; background: var(--ink); border-radius: 33rpx 9rpx 33rpx 9rpx; font-size: 20rpx; line-height: 66rpx; }
.order-save { height: 72rpx; margin: 26rpx 0 0; color: #fff; background: linear-gradient(110deg, var(--red-dark), var(--red)); border-radius: 36rpx 11rpx 36rpx 11rpx; font-size: 22rpx; font-weight: 800; line-height: 72rpx; }
</style>
