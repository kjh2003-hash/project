import { STORAGE_KEYS } from '../constants/index.js';

// ============================================================================
// 저장소 관리자.
// Chrome Local Storage를 쉽게 쓰고 읽을 수 있게 감싸둔 객체.
// ============================================================================

export const StorageManager = {
  /**
   * [저장 함수]
   * key와 value를 받아서 저장.
   */
  async set(key, value) {
    return chrome.storage.local.set({ [key]: value });
  },

  /**
   * [불러오기 함수]
   * key에 해당하는 값을 가져오고, 없으면 기본값(defaultValue) 반환.
   */
  async get(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (e) {
      // 읽다가 실패하면 로그 남기고 기본값 반환
      console.error(`[Storage] Load failed for key: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * [큐 업데이트 헬퍼]
   * 재생 목록(Queue)을 저장하는 단축 함수.
   */
  async updateQueue(queue) {
    await this.set(STORAGE_KEYS.QUEUE, queue);
  }
};