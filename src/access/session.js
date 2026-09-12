import { reactive } from 'vue'

export const accessState = reactive({ role: 'unknown', memberId: '' })

export function applyAccess(next = {}) {
  accessState.role = next.role || 'unknown'
  accessState.memberId = next.memberId || ''
  return accessState
}

export function resetAccess() {
  applyAccess({ role: 'unknown', memberId: '' })
}

export async function loadAccess(repository) {
  return applyAccess(await repository.getAccessState())
}

export function canEdit() {
  return accessState.role === 'family'
}
