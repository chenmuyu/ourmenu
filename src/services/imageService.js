export function mergeImagePaths(current = [], incoming = [], limit = 9) {
  return [...new Set([...current, ...incoming])].slice(0, limit)
}

export async function resolveImagePath(localPath, uploader) {
  try {
    return { url: await uploader(localPath), pending: false }
  } catch {
    return { url: localPath, pending: true }
  }
}

export function chooseImages(count = 1) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: ({ tempFilePaths }) => resolve(tempFilePaths),
      fail: reject,
    })
  })
}

export async function uploadForCurrentMode(localPath) {
  if (import.meta.env.VITE_USE_CLOUD !== 'true' || typeof wx === 'undefined' || !wx.cloud) {
    return { url: localPath, pending: false }
  }

  return resolveImagePath(localPath, async (path) => {
    const extension = path.split('.').pop() || 'jpg'
    const cloudPath = `two-person-menu/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`
    const result = await wx.cloud.uploadFile({ cloudPath, filePath: path })
    return result.fileID
  })
}
