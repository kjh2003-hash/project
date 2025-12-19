import { StorageManager } from '../common/storage.js';
import { ACTIONS, TARGETS, STORAGE_KEYS, CONFIG } from '../constants/index.js';
import { safeSendMessage } from '../common/utils.js';

// ============================================================================
// [1] 메모리 상태 관리
// 현재 재생 상태, 큐 등을 메모리에 들고 있는 변수.
// ============================================================================
let memoryState = {
  queue: [],           // 재생 대기열
  currentIndex: -1,    // 현재 재생 중인 인덱스
  isPlaying: false,    // 재생 여부
  repeatMode: CONFIG.REPEAT_MODES.OFF, // 반복 모드
  isShuffle: false,    // 셔플 여부
  volume: CONFIG.DEFAULT_VOLUME, // 볼륨
  isMuted: false,      // 음소거 여부
  currentTime: 0,      // 현재 재생 시간
  duration: 0          // 전체 길이
};

// Offscreen 문서(플레이어)가 준비되었는지 체크하는 플래그
let isOffscreenReady = false;

// ============================================================================
// [2] 초기화 및 상태 복구 함수
// ============================================================================

/**
 * [상태 복구]
 * 확장 프로그램이 재시작될 때 저장소에서 기존 상태를 불러옴.
 */
const restoreState = async () => {
  try {
    const [queue, index, volume, repeat, shuffle, muted] = await Promise.all([
      StorageManager.get(STORAGE_KEYS.QUEUE, []),
      StorageManager.get(STORAGE_KEYS.CURRENT_INDEX, -1),
      StorageManager.get(STORAGE_KEYS.VOLUME, CONFIG.DEFAULT_VOLUME),
      StorageManager.get(STORAGE_KEYS.REPEAT, CONFIG.REPEAT_MODES.OFF),
      StorageManager.get(STORAGE_KEYS.SHUFFLE, false),
      StorageManager.get(STORAGE_KEYS.IS_MUTED, false)
    ]);

    memoryState.queue = Array.isArray(queue) ? queue : [];
    memoryState.currentIndex = index;
    memoryState.volume = volume;
    memoryState.repeatMode = repeat;
    memoryState.isShuffle = shuffle;
    memoryState.isMuted = muted;

    // 인덱스가 범위를 벗어났으면 보정
    if (memoryState.currentIndex >= memoryState.queue.length) {
      memoryState.currentIndex = memoryState.queue.length > 0 ? 0 : -1;
    }
  } catch (e) {
    console.error('State Restore Failed:', e);
  }
};

/**
 * [Offscreen 준비]
 * 음악을 재생할 숨겨진 HTML 문서가 없으면 만듬.
 */
const ensureOffscreenReady = async () => {
  const hasDoc = await chrome.offscreen.hasDocument();
  if (!hasDoc) {
    try {
      await chrome.offscreen.createDocument({
        url: CONFIG.OFFSCREEN_SPECS.PATH,
        reasons: CONFIG.OFFSCREEN_SPECS.REASONS,
        justification: CONFIG.OFFSCREEN_SPECS.JUSTIFICATION
      });
      isOffscreenReady = true;
    } catch (e) {
      console.warn('Offscreen creation warning:', e);
      isOffscreenReady = true; // 실패해도 일단 진행
    }
  } else {
    isOffscreenReady = true;
  }
};

// ============================================================================
// [3] 메시지 리스너 (명령 처리기)
// 팝업이나 플레이어에서 온 메시지를 받아서 처리.
// ============================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 1. 에러 전파 메시지 처리
  if (msg.action === ACTIONS.SHOW_ERROR) {
    safeSendMessage({
      target: TARGETS.POPUP,
      action: ACTIONS.SHOW_ERROR,
      payload: msg.payload
    });
    return true;
  }

  // 2. 처리할 대상인지 확인 (백그라운드 행이거나 내부 신호일 때만)
  const isInternalSignal = [ACTIONS.OFFSCREEN_READY, ACTIONS.OFFSCREEN_STATE_UPDATE].includes(msg.action);
  if (msg.target !== TARGETS.BACKGROUND && !isInternalSignal) return false;

  // 3. 비동기 작업 실행
  (async () => {
    try {
      await restoreState();

      // 재생 관련 명령이면 플레이어 문서가 있는지 먼저 확인
      if ([ACTIONS.PLAY_NEW, ACTIONS.TOGGLE_PLAY, ACTIONS.NEXT_TRACK, ACTIONS.PREV_TRACK, ACTIONS.TOGGLE_MUTE].includes(msg.action)) {
        await ensureOffscreenReady();
      }

      // 실제 액션 로직 수행
      const result = await handleAction(msg.action, msg.payload);
      sendResponse({ success: true, ...result });

    } catch (e) {
      console.error('[Background] Action failed:', e);
      sendResponse({ success: false, error: e.message || 'Background Error' });
    }
  })();

  return true; // 비동기 응답을 위해 true 반환
});

// ============================================================================
// [4] 액션 핸들러 (실제 로직 분기)
// ============================================================================
async function handleAction(action, payload) {
  switch (action) {
    // --- [플레이어 준비 완료] ---
    case ACTIONS.OFFSCREEN_READY:
      isOffscreenReady = true;
      // 볼륨과 뮤트 상태 동기화
      sendToOffscreen(ACTIONS.SET_VOLUME, { volume: memoryState.volume });
      if (memoryState.isMuted) {
        sendToOffscreen(ACTIONS.TOGGLE_MUTE, { mute: true });
      }
      break;

    // --- [새 곡 재생] ---
    case ACTIONS.PLAY_NEW:
      if (!payload || !payload.videoId) return { error: 'Invalid payload' };
      
      const existingIndex = memoryState.queue.findIndex(i => i.videoId === payload.videoId);
      
      if (existingIndex !== -1) {
        memoryState.currentIndex = existingIndex;
      } else {
        memoryState.queue.push(payload);
        memoryState.currentIndex = memoryState.queue.length - 1;
        await StorageManager.set(STORAGE_KEYS.QUEUE, memoryState.queue);
      }
      
      await StorageManager.set(STORAGE_KEYS.CURRENT_INDEX, memoryState.currentIndex);
      await playCurrent();
      broadcastToPopup();
      return { played: true };

    // --- [큐에 추가] ---
    case ACTIONS.ADD_TO_QUEUE:
      if (!payload || !payload.videoId) return { error: 'Invalid payload' };
      if (!memoryState.queue.some(i => i.videoId === payload.videoId)) {
        memoryState.queue.push(payload);
        await StorageManager.set(STORAGE_KEYS.QUEUE, memoryState.queue);
        broadcastToPopup();
        return { added: true };
      }
      return { added: false, reason: 'duplicate' };

    // --- [큐에서 제거] ---
    case ACTIONS.REMOVE_FROM_QUEUE:
      const removeIndex = payload.index;
      if (typeof removeIndex !== 'number') return { error: 'Invalid index' };
      
      memoryState.queue.splice(removeIndex, 1);
      
      // 현재 재생 중인 곡보다 앞의 곡을 지우면 인덱스 조정
      if (removeIndex < memoryState.currentIndex) {
        memoryState.currentIndex--;
      } 
      // 현재 재생 중인 곡을 지우면
      else if (removeIndex === memoryState.currentIndex) {
        if (memoryState.queue.length === 0) {
          memoryState.currentIndex = -1;
          memoryState.isPlaying = false;
          sendToOffscreen(ACTIONS.PLAY_NEW, { videoId: null }); // 정지
        } else {
            if (memoryState.currentIndex >= memoryState.queue.length) {
                memoryState.currentIndex = memoryState.queue.length - 1;
            }
        }
      }
      
      await StorageManager.set(STORAGE_KEYS.QUEUE, memoryState.queue);
      await StorageManager.set(STORAGE_KEYS.CURRENT_INDEX, memoryState.currentIndex);
      broadcastToPopup();
      return { success: true };

    // --- [재생/일시정지 토글] ---
    case ACTIONS.TOGGLE_PLAY:
      sendToOffscreen(ACTIONS.TOGGLE_PLAY);
      break;

    // --- [셔플 토글] ---
    case ACTIONS.TOGGLE_SHUFFLE:
      memoryState.isShuffle = !memoryState.isShuffle;
      await StorageManager.set(STORAGE_KEYS.SHUFFLE, memoryState.isShuffle);
      broadcastToPopup();
      break;

    // --- [반복 모드 변경] ---
    case ACTIONS.TOGGLE_REPEAT:
      const modes = Object.values(CONFIG.REPEAT_MODES);
      const currentIdx = modes.indexOf(memoryState.repeatMode);
      memoryState.repeatMode = modes[(currentIdx + 1) % modes.length];
      await StorageManager.set(STORAGE_KEYS.REPEAT, memoryState.repeatMode);
      broadcastToPopup();
      break;

    // --- [음소거 토글] ---
    case ACTIONS.TOGGLE_MUTE:
      memoryState.isMuted = !memoryState.isMuted;
      await StorageManager.set(STORAGE_KEYS.IS_MUTED, memoryState.isMuted);
      sendToOffscreen(ACTIONS.TOGGLE_MUTE, { mute: memoryState.isMuted });
      broadcastToPopup();
      break;

    // --- [상태 업데이트 (플레이어로부터)] ---
    case ACTIONS.OFFSCREEN_STATE_UPDATE:
      memoryState = { ...memoryState, ...payload };
      if (payload.isMuted !== undefined) memoryState.isMuted = payload.isMuted;
      if (payload.state) memoryState.isPlaying = (payload.state === CONFIG.PLAYER.STATE_PLAYING);
      if (payload.ended) handleEnded();
      broadcastToPopup();
      break;

    // --- [현재 상태 요청] ---
    case ACTIONS.GET_CURRENT_STATE:
      broadcastToPopup();
      break;
      
    // --- [큐 전체 비우기] ---
    case ACTIONS.CLEAR_QUEUE:
      memoryState.queue = [];
      memoryState.currentIndex = -1;
      memoryState.isPlaying = false;
      memoryState.currentTime = 0;
      memoryState.duration = 0;
      await StorageManager.set(STORAGE_KEYS.QUEUE, []);
      await StorageManager.set(STORAGE_KEYS.CURRENT_INDEX, -1);
      sendToOffscreen(ACTIONS.PLAY_NEW, { videoId: null });
      broadcastToPopup();
      break;
      
    case ACTIONS.NEXT_TRACK: playNext(); break;
    case ACTIONS.PREV_TRACK: playPrev(); break;
  }
  return {};
}

// ============================================================================
// [5] 재생 제어 헬퍼 함수
// ============================================================================

/** [현재 곡 재생] */
async function playCurrent() {
  const track = memoryState.queue[memoryState.currentIndex];
  if (track) {
    sendToOffscreen(ACTIONS.PLAY_NEW, track);
    memoryState.isPlaying = true;
  }
}

/** [다음 곡 로직] */
function playNext() {
  if (memoryState.queue.length === 0) return;
  
  if (memoryState.isShuffle) {
    if (memoryState.queue.length > 1) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * memoryState.queue.length);
      } while (nextIndex === memoryState.currentIndex);
      memoryState.currentIndex = nextIndex;
    } else {
      memoryState.currentIndex = 0;
    }
  } else {
    memoryState.currentIndex = (memoryState.currentIndex + 1) % memoryState.queue.length;
  }
  
  StorageManager.set(STORAGE_KEYS.CURRENT_INDEX, memoryState.currentIndex);
  playCurrent();
}

/** [이전 곡 로직] */
function playPrev() {
  if (memoryState.queue.length === 0) return;
  memoryState.currentIndex = (memoryState.currentIndex - 1 + memoryState.queue.length) % memoryState.queue.length;
  StorageManager.set(STORAGE_KEYS.CURRENT_INDEX, memoryState.currentIndex);
  playCurrent();
}

/** [곡이 끝났을 때 로직] */
function handleEnded() {
  if (memoryState.repeatMode === CONFIG.REPEAT_MODES.ONE) {
    playCurrent(); // 한 곡 반복이면 다시 재생
  } else if (memoryState.repeatMode === CONFIG.REPEAT_MODES.ALL || memoryState.currentIndex < memoryState.queue.length - 1 || memoryState.isShuffle) {
    playNext(); // 다음 곡으로
  } else {
    memoryState.isPlaying = false; // 끝
    broadcastToPopup();
  }
}

// ============================================================================
// [6] 통신 헬퍼
// ============================================================================
const broadcastToPopup = () => {
  safeSendMessage({ target: TARGETS.POPUP, action: ACTIONS.SYNC_UI, payload: memoryState });
};

const sendToOffscreen = (action, payload = {}) => {
  safeSendMessage({ target: TARGETS.OFFSCREEN, action, payload });
};