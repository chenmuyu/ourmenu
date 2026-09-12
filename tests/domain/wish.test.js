import { describe, expect, it } from 'vitest'
import { getWishThumbnail, sortWishes, validateWish } from '../../src/domain/wish.js'

describe('validateWish', () => {
  it('名称必填', () => {
    expect(validateWish({ status: 'want' })).toEqual({ valid: false, message: '请填写想吃的东西' })
  })

  it('状态只能是想吃或吃过还想吃', () => {
    expect(validateWish({ name: '生椰拿铁', status: 'unknown' })).toEqual({
      valid: false,
      message: '请选择记录状态',
    })
  })

  it('图片为空时仍可保存', () => {
    expect(validateWish({ name: '生椰拿铁', status: 'again' })).toEqual({ valid: true, message: '' })
  })
})

describe('wish helpers', () => {
  it('按更新时间倒序排列', () => {
    expect(sortWishes([{ id: 'old', updatedAt: 1 }, { id: 'new', updatedAt: 2 }]).map((item) => item.id)).toEqual([
      'new',
      'old',
    ])
  })

  it('优先使用封面，其次使用第一张详情图', () => {
    expect(getWishThumbnail({ coverUrl: 'cover.jpg', imageUrls: ['detail.jpg'] })).toBe('cover.jpg')
    expect(getWishThumbnail({ imageUrls: ['detail.jpg'] })).toBe('detail.jpg')
  })
})
