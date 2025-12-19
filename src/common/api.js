import { CONFIG } from '../constants/index.js';

// ============================================================================
// 유튜브 API 통신 모듈.
// 검색어(query)를 받아서 유튜브 서버에 요청하고 결과를 가져옴.
// ============================================================================

export const YouTubeAPI = {
  // 설정 파일에서 API 키 가져오기
  apiKey: CONFIG.API.KEY,

  /**
   * [검색 함수]
   * @param {string} query 검색어
   * @param {number} maxResults 최대 결과 개수 (선택)
   * @returns {Promise<Array>} 검색 결과 리스트
   */
  async search(query, maxResults) {
    // 1. 가져올 개수 설정 (기본값 사용)
    const finalLimit = (maxResults !== undefined && maxResults !== null)
      ? Number(maxResults)
      : CONFIG.LIMITS.SEARCH_RESULTS;

    // 2. API 키 확인
    if (!this.apiKey) {
      throw new Error('API Key 없음.');
    }

    // 3. 타임아웃 설정 (5초 동안 응답 없으면 취소)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // 4. 요청 파라미터 구성 (URL 뒤에 붙을 내용들)
      const BUFFER_COUNT = 5; // 중복이나 오류 걸러내기 위해 여유분 요청
      const params = new URLSearchParams({
        part: CONFIG.API.V3_PARTS,
        q: query,
        type: CONFIG.API.V3_TYPE,
        maxResults: finalLimit + BUFFER_COUNT,
        key: this.apiKey,
        // [핵심 추가] 퍼가기(Embed)가 허용된 영상만 검색!
        // 이걸 추가하면 저작권으로 인해 외부 재생이 막힌 뮤비를 미리 거를 수 있습니다.
        videoEmbeddable: 'true' 
      });

      // 5. 실제 서버 요청 (Fetch)
      const response = await fetch(`${CONFIG.API.ENDPOINTS.SEARCH}?${params.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // 6. 응답 상태 확인
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      // 7. 결과 데이터 변환 (필요한 정보만 쏙쏙 뽑기)
      const data = await response.json();

      const items = (data.items || [])
        .filter(item => item.id && item.id.videoId) // 비디오 ID 있는 것만
        .slice(0, finalLimit) // 원하는 개수만큼 자르기
        .map(item => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium.url
        }));

      return items;

    } catch (e) {
      // 에러 발생 시 로그 남기고 호출한 곳으로 에러 던지기
      console.error('[API] Search Error:', e);
      throw e;
    }
  }
};