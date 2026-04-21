import type { UserInfo } from '../types/workflow';

export function getStoredUserInfo(): UserInfo {
  try {
    const raw = localStorage.getItem('dawnix_user_info');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}
