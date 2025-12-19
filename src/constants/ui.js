// ============================================================================
// UI 관련 상수 모음 파일.
// HTML 태그의 ID, 클래스 이름, 화면에 표시할 텍스트 등을 여기서 관리.
// ============================================================================

export const DOM_SELECTORS = {
  // HTML 요소의 ID 모음 (getElementById로 찾을 때 사용)
  IDS: {
    TRACK_TITLE: 'track-title',
    CHANNEL_NAME: 'channel-name',
    MAIN_THUMBNAIL: 'main-thumbnail',
    PROGRESS_BAR: 'progress-bar',
    VOLUME_SLIDER: 'volume-slider',
    CURRENT_TIME: 'current-time',
    TOTAL_TIME: 'total-time',
    BTN_PLAY_PAUSE: 'btn-play-pause',
    BTN_PREV: 'btn-prev',
    BTN_NEXT: 'btn-next',
    BTN_SHUFFLE: 'btn-shuffle',
    BTN_REPEAT: 'btn-repeat',
    BTN_MUTE: 'btn-mute',
    SEARCH_INPUT: 'search-input',
    SEARCH_RESULTS: 'search-results-container',
    QUEUE_CONTAINER: 'queue-container',
    BTN_CLEAR_ALL: 'btn-clear-all',
    QUEUE_COUNT: 'queue-count',
    YT_PLAYER_ID: 'youtube-iframe',
    HISTORY_BODY: 'history-body',
    BTN_CLEAR_HISTORY: 'btn-clear-history',
    BTN_SYNC: 'btn-sync',
    TOAST_CONTAINER: 'toast-container',
    CONFIRM_MODAL: 'confirm-modal',
    MODAL_MESSAGE: 'modal-message',
    MODAL_CONFIRM: 'modal-confirm',
    MODAL_CANCEL: 'modal-cancel',
    BTN_OPEN_OPTIONS: 'btn-open-options'
  },

  // CSS 클래스 이름 모음
  CLASSES: {
    ACTIVE: 'active',
    NAV_BTN: 'nav-btn',
    NAV_ITEM: 'nav-item',
    TAB_CONTENT: 'tab-content',
    CONTENT_SECTION: 'content-section',
    SEARCH_ITEM_WRAPPER: 'search-item-wrapper',
    SEARCH_ITEM_INNER: 'search-item-inner',
    SEARCH_ITEM_CONTENT: 'search-item-content',
    SEARCH_ITEM_ACTIONS: 'search-item-actions',
    SEARCH_ITEM_INFO: 'search-item-info',
    SLIDE_ACTIVE: 'slide-active',
    BTN_ACTION_PLAY: 'btn-action-play',
    BTN_ACTION_ADD: 'btn-action-add',
    BTN_ACTION_DELETE: 'btn-action-delete',
    BTN_DANGER_SMALL: 'btn-danger-small',
    MODAL_VISIBLE: 'modal-visible',
    ACTIVE_TRACK: 'active-track',
    PLAYING_TITLE: 'playing-title',
    PLAYING_LABEL: 'playing-label',
    TOAST: 'toast',
    TOAST_SHOW: 'show',
    CATEGORY_CHIP: 'category-chip',
    CATEGORY_CONTAINER: 'category-container',
    UI_ICON_ASSET: 'ui-icon-asset',
    CENTER_MESSAGE: 'center-message'
  },

  // ID 조합용 접두사
  PREFIXES: {
    TAB_SECTION: 'tab-',
    CONTENT_SECTION: 'section-'
  },

  // CSS 스타일 값
  STYLES: {
    ACCENT_COLOR: 'var(--accent-neon)',
    TEXT_SECONDARY: 'var(--text-secondary)',
    OPACITY_DIM: '0.3',
    OPACITY_FULL: '1'
  }
};

// 화면에 보여줄 텍스트 메시지 모음
export const UI_TEXT = {
  DEFAULT_TITLE: '음악을 재생주세요.',
  DEFAULT_CHANNEL: 'Anywhere Music',
  SEARCHING: 'Finding your music...',
  NO_RESULTS: '검색 결과가 없습니다.',
  EMPTY_QUEUE: '큐가 비어있습니다.',
  EMPTY_HISTORY_ROW: '<tr><td colspan="3" style="text-align:center;">감상 기록이 없습니다.</td></tr>',
  CONFIRM_CLEAR_HISTORY: '모든 기록을 삭제하겠습니까?',
  CONFIRM_DELETE_ITEM: '이 항목을 삭제하시겠습니까?',
  SYNCING: '동기화 중...',
  SYNC_DONE: '완료',
  SYNC_BTN_LABEL: '지금 동기화',
  ADDED_TO_QUEUE: '음악이 추가됐습니다.',
  RECOMMENDED_HEADER: '추천 카테고리',
  LABEL_PLAYING: 'PLAYING',
  MSG_QUEUE_CLEARED: '전체 비우기',
  MSG_ALREADY_IN_QUEUE: '이미 리스트에 존재합니다.',
  MSG_UNKNOWN_ERROR: '알 수 없는 오류',
  MSG_PLAY_FAIL: '재생 실패'
};

// 이벤트 타입 이름
export const EVENT_TYPES = {
  CLICK: 'click',
  DOM_CONTENT_LOADED: 'DOMContentLoaded',
  INPUT: 'input',
  CHANGE: 'change',
  KEYDOWN: 'keydown'
};

// 탭 이름
export const TABS = {
  PLAYER: 'player',
  QUEUE: 'queue',
  SEARCH: 'search',
  SETTINGS: 'settings'
};