// ============================================================================
// [전역 설정 파일]
// 프로그램 전체에서 사용하는 "변하지 않는 값(상수)"들을 모아둔 곳.
// 나중에 설정을 바꿀 때 코드를 뒤지지 않고 이 파일만 고치면 됨.
// ============================================================================

export const CONFIG = {
  // 유튜브 데이터 API 설정
  API: {
    // [중요] Google Cloud Console에서 발급받은 API Key.
    KEY: 'AIzaSyBIFmYQd0hxY-vHjy5-P0VMKFpwHGReHgQ', 

    // 유튜브 API 서버 주소 (영상 검색용)
    ENDPOINTS: {
      SEARCH: 'https://www.googleapis.com/youtube/v3/search'
    },

    // 받아올 데이터의 종류. 'snippet'은 제목, 썸네일 등 기본 정보만 가져온다는 뜻.
    V3_PARTS: 'snippet',

    // 검색 대상을 'video'(영상)로 한정.
    V3_TYPE: 'video'
  },
  
  // 유튜브 Iframe 플레이어 설정
  YT_IFRAME_API_URL: 'https://www.youtube.com/iframe_api', // 플레이어 스크립트 로딩 주소
  YT_THUMB_BASE: 'https://img.youtube.com/vi/',            // 썸네일 이미지 기본 주소 (뒤에 ID를 붙여서 씀)
  
  // 썸네일 로딩에 실패했을 때(이미지 깨짐) 대신 보여줄 기본 이미지.
  FALLBACK_THUMB: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" style="background:%231a1a1a"%3E%3Cpath fill="%23333" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/%3E%3C/svg%3E',
  
  // UI 아이콘 데이터 (SVG)
  UI_ICONS: {
    PLAY: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M320-200v-560l440 280-440 280Z"/></svg>`,
    PAUSE: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/></svg>`,
    NEXT: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Z"/></svg>`,
    PREV: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Z"/></svg>`,
    SHUFFLE: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M560-160v-80h104L537-371l57-57 126 126v-104h80v246H560ZM160-592v-80h134l192 192-57 57-135-135H160Zm274-8l126-126v-104h80v246H560v-80h104L491-543l-57-57Zm-82 227-57-57 135-135H160v-80h134l192 192Z"/></svg>`,
    REPEAT: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-80 120-240l160-160 56 58-62 62h406v-160h80v240H274l62 62-56 58Zm-80-440v-240h486l-62-62 56-58 160 160-160 160-56-58 62-62H280v160h-80Z"/></svg>`,
    VOLUME: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320Z"/></svg>`,
    MUTE: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-360H280v240h160l200 200v-128l208 208-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-600 240-190H120v-240h160l200-200v30Zm8-122-82-82 184-184v184l-102 82Z"/></svg>`,
    
    // 큐(Queue) 관리용 아이콘
    ADD: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>`,
    DELETE: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`,
    
    // 하단 탭 네비게이션용 아이콘
    NAV_PLAYER: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M320-240v-480h80v480h-80Zm160 0v-480h80v480h-80Zm160 0v-480h80v480h-80Z"/></svg>`,
    NAV_QUEUE: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M160-200v-80h640v80H160Zm0-160v-80h640v80H160Zm0-160v-80h640v80H160Zm0-160v-80h640v80H160Z"/></svg>`,
    NAV_SEARCH: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>`,
    NAV_SETTINGS: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-1 13.5l103 78-110 190-119-50q-11 8-23 15t-24 12l-16 128H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Z"/></svg>`
  },

  // 추천 검색어 목록
  SEARCH_CATEGORIES: [
    { label: 'Lofi', query: 'Lofi hip hop radio' },
    { label: 'K-Pop', query: '2024 New K-Pop Hits' },
    { label: 'Rock', query: 'Classic Rock Essentials' },
    { label: 'Jazz', query: 'Smooth Jazz for Study' },
    { label: 'Sleep', query: 'Deep Sleep Music Rain' },
    { label: 'Workout', query: 'High Energy Gym Mix' }
  ],

  // 플레이어 내부 상태 상수
  PLAYER: {
    QUALITY: 'small', // 재생 품질
    SIZE_MIN: '1',    // 최소 크기
    STATE_PLAYING: 'playing', // 재생 상태값
    STATE_PAUSED: 'paused'    // 일시정지 상태값
  },
  
  // 유튜브 플레이어 옵션 (PlayerVars)
  PLAYER_VARS: {
    autoplay: 1,       // 1이면 비디오 로드 시 자동 재생
    controls: 0,       // 0이면 유튜브 기본 컨트롤바(재생바) 숨김 (우리가 만든 UI 쓸거니까)
    disablekb: 1,      // 1이면 키보드 단축키 비활성화
    modestbranding: 1, // 1이면 유튜브 로고 작게 표시
    rel: 0,            // 0이면 재생 종료 후 관련 영상 안 보여줌
    fs: 0,             // 0이면 전체화면 버튼 숨김
    playsinline: 1,    // [추가] iOS 등에서 전체화면 방지
    enablejsapi: 1     // [중요] IFrame API 활성화 (Raw PostMessage 제어에 필수)
  },

  // 앱 처음 실행 시 기본 볼륨 (0~100)
  DEFAULT_VOLUME: 50,
  
  // Offscreen 문서 설정
  OFFSCREEN_SPECS: {
    PATH: 'src/offscreen/offscreen.html', // 파일 경로
    REASONS: ['AUDIO_PLAYBACK'],          // 사용 목적 (오디오 재생)
    JUSTIFICATION: 'Background playback for YT Music' // 크롬에게 설명할 사유
  },
  
  // 제한값 (Limits)
  LIMITS: { 
    HISTORY: 50,          // 감상 기록은 최대 50개까지만 저장
    SEARCH_RESULTS: 10,   // 검색 결과는 한 번에 10개만 가져옴
    VIDEO_ID_LENGTH: 11   // 유튜브 비디오 ID는 항상 11글자임
  },

  // 타이밍 설정 (밀리초 단위)
  TIMING: { 
    POLLING_INTERVAL: 1000, // 1초마다 재생 시간 업데이트
    SYNC_FEEDBACK: 1500,    // 동기화 버튼 눌렀을 때 '완료' 표시 시간
    SYNC_RESET: 2000,       // 동기화 버튼 원래대로 돌아오는 시간
    ANIMATION_FRAME: 50,    // 애니메이션 프레임 간격
    DEBOUNCE_DELAY: 500,    // 검색어 입력 후 0.5초 기다렸다가 검색 (서버 과부하 방지)
    TOAST_FADE_IN: 10,      // 토스트 메시지 나타나는 효과 시간
    TOAST_DURATION: 2500,   // 토스트 메시지 떠 있는 시간
    TOAST_REMOVE_DELAY: 300 // 토스트 사라지고 DOM에서 삭제될 때까지 대기 시간
  },

  // 반복 재생 모드
  REPEAT_MODES: { 
    OFF: 'OFF',  // 반복 안함
    ALL: 'ALL', // 전체 반복
    ONE: 'ONE'  // 한 곡 반복
  }
};

// --------------------------------------------------------------------------
// [유틸리티 정규식]
// 유튜브 링크에서 비디오 ID만 뽑아내기 위한 정규표현식.
// --------------------------------------------------------------------------
export const PATTERNS = {
  YT_VIDEO_ID_REGEX: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
};