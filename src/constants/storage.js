// ============================================================================
// 저장소 키 이름 정의 파일.
// 브라우저 저장소(local storage)에 데이터를 저장할 때 사용할 키 값들.
// ============================================================================

export const STORAGE_KEYS = {
  QUEUE: 'yt_queue',           // 재생 목록
  VOLUME: 'yt_volume',         // 볼륨 값
  REPEAT: 'yt_repeat',         // 반복 모드
  SHUFFLE: 'yt_shuffle',       // 셔플 모드
  HISTORY: 'yt_history',       // 감상 기록
  CURRENT_INDEX: 'yt_current_index', // 현재 재생 중인 곡 번호
  IS_MUTED: 'yt_is_muted'      // 음소거 여부
};