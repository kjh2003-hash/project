// ============================================================================
// 편리한 도구(유틸리티) 함수 모음.
// 시간 포맷팅, 안전한 메시지 전송 등 잡다한 기능을 모아둠.
// ============================================================================

/**
 * [디바운스 함수]
 * 연속으로 입력이 들어올 때(예: 검색어 타이핑),
 * 마지막 입력 후 일정 시간이 지나야만 함수를 실행하게 함.
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * [시간 변환 함수]
 * 초(seconds)를 받아서 "분:초" 형태의 문자열로 바꿔줌.
 * 예: 65 -> "1:05"
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * [안전한 메시지 전송 함수]
 * 크롬 확장프로그램 메시지를 보낼 때 에러가 나도 죽지 않게 감싸주는 함수.
 * 수신자가 없거나 오류가 발생하면 콘솔에 경고만 남기고 넘어감.
 */
export const safeSendMessage = (message) => {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        // 런타임 에러 체크 (수신자가 닫혀있거나 응답이 없을 때)
        if (chrome.runtime.lastError) {
          console.warn('[Message] Runtime Warning:', chrome.runtime.lastError.message);
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response || {
            success: false,
            error: 'No response'
          });
        }
      });
    } catch (e) {
      console.error('[Message] Send Failed:', e);
      resolve({
        success: false,
        error: e.message
      });
    }
  });
};