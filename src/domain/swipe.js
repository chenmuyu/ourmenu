export function resolveOpenedMenu({ id, openedId, startX, endX, threshold = 40 }) {
  const distance = endX - startX
  if (distance <= -threshold) return id
  if (distance >= threshold && openedId === id) return ''
  return openedId
}

export function clampSwipeOffset(distance, isOpen, actionWidth) {
  const startOffset = isOpen ? -actionWidth : 0
  return Math.max(-actionWidth, Math.min(0, startOffset + distance))
}
