// ============================================================================
// 액션(명령어) 이름 정의 파일.
// 팝업, 백그라운드, 플레이어가 서로 대화할 때 쓸 약속된 단어들.
// ============================================================================

export const ACTIONS = {
  // 1. 재생 관련 명령
  PLAY_NEW: 'PLAY_NEW',        // 새 곡 재생
  TOGGLE_PLAY: 'TOGGLE_PLAY',  // 재생/일시정지 토글
  NEXT_TRACK: 'NEXT_TRACK',    // 다음 곡
  PREV_TRACK: 'PREV_TRACK',    // 이전 곡
  SEEK: 'SEEK',                // 시간 이동

  // 2. 설정 변경 명령
  TOGGLE_REPEAT: 'TOGGLE_REPEAT',   // 반복 모드 변경
  TOGGLE_SHUFFLE: 'TOGGLE_SHUFFLE', // 셔플 모드 변경
  TOGGLE_MUTE: 'TOGGLE_MUTE',       // 음소거 토글
  SET_VOLUME: 'SET_VOLUME',         // 볼륨 조절
  GET_CURRENT_STATE: 'GET_CURRENT_STATE', // 현재 상태 요청

  // 3. 재생 목록(큐) 관리 명령
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',           // 목록에 추가
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE', // 목록에서 제거
  CLEAR_QUEUE: 'CLEAR_QUEUE',             // 목록 비우기

  // 4. 시스템 동기화 및 알림
  OFFSCREEN_READY: 'OFFSCREEN_READY',              // 플레이어 준비됨 알림
  OFFSCREEN_STATE_UPDATE: 'OFFSCREEN_STATE_UPDATE', // 플레이어 상태 업데이트
  SYNC_UI: 'SYNC_UI',                              // 팝업 UI 동기화
  SHOW_ERROR: 'SHOW_ERROR'                         // 에러 발생 알림
};

// 메시지를 받을 대상(수신자) 정의
export const TARGETS = {
  OFFSCREEN: 'offscreen', // 숨겨진 플레이어 창
  POPUP: 'popup',         // 사용자가 보는 팝업 창
  BACKGROUND: 'background' // 확장 프로그램의 백그라운드 스크립트
};