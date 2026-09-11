import { describe, expect, it } from 'vitest'
import { mergeImagePaths, resolveImagePath } from '../../src/services/imageService.js'

describe('mergeImagePaths', () => {
  it('合并图片时去重并遵守数量上限', () => {
    expect(mergeImagePaths(['/a.jpg'], ['/a.jpg', '/b.jpg', '/c.jpg'], 2)).toEqual(['/a.jpg', '/b.jpg'])
  })
})

describe('resolveImagePath', () => {
  it('上传成功时返回云文件地址', async () => {
    const result = await resolveImagePath('/local/a.jpg', async () => 'cloud://menu/a.jpg')

    expect(result).toEqual({ url: 'cloud://menu/a.jpg', pending: false })
  })

  it('上传失败时保留本地路径并标记待上传', async () => {
    const result = await resolveImagePath('/local/a.jpg', async () => {
      throw new Error('network failed')
    })

    expect(result).toEqual({ url: '/local/a.jpg', pending: true })
  })
})
