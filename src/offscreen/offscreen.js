import { ACTIONS, TARGETS } from '../constants/actions.js';
import { CONFIG } from '../constants/config.js';

/**
 * ============================================================================
 * [Offscreen Player - Zombie Mode (State Enforcer)]
 * 1. State Enforcement: 사용자가 정지 버튼을 누르지 않았는데 플레이어가 멈추면(Autoplay Block),
 * 즉시 다시 재생 명령을 보내는 '좀비 로직'을 적용합니다.
 * 2. shouldPlay Flag: 현재 우리가 재생을 원하는지 의도를 명확히 추적합니다.
 * ============================================================================
 */

const container = document.getElementById('player-container');
let iframe = null;
let retryInterval = null;  
let handshakeInterval = null;
let currentVideoId = null;
let isReady = false; 

// [핵심] 재생 의도 추적 플래그
// True면 무슨 일이 있어도 재생 상태를 유지하려고 노력함
let shouldPlay = false;

// ============================================================================
// [1] Iframe 생성 (1단계: 빈 플레이어 로드)
// ============================================================================
function createIframe(videoId) {
  if (iframe && isReady) {
    loadAndPlay(videoId);
    return;
  }

  if (iframe) {
    try { container.removeChild(iframe); } catch(e) {}
    iframe = null;
  }
  stopRetry();
  stopHandshake();
  isReady = false;

  console.log(`[Offscreen] Phase 1: Loading Empty Player...`);

  const origin = window.location.origin;
  const params = new URLSearchParams({
    autoplay: 1,      
    controls: 0,      
    enablejsapi: 1,   
    playsinline: 1,
    origin: origin,   
    widget_referrer: origin,
    rel: 0,
    fs: 0,
    disablekb: 1
  });

  iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/?${params.toString()}`;
  
  iframe.allow = "autoplay; encrypted-media; clipboard-write; picture-in-picture";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.referrerPolicy = "origin"; 
  
  container.appendChild(iframe);
  currentVideoId = videoId;

  iframe.onload = () => {
    console.log('[Offscreen] Iframe loaded. Starting Handshake...');
    startHandshake();
  };
}

// ============================================================================
// [2] 능동적 핸드쉐이크
// ============================================================================
function startHandshake() {
  stopHandshake();
  handshakeInterval = setInterval(() => {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'listening',
      id: 1, 
      channel: 'widget'
    }), '*');
  }, 300);
}

function stopHandshake() {
  if (handshakeInterval) {
    clearInterval(handshakeInterval);
    handshakeInterval = null;
  }
}

// ============================================================================
// [3] 비디오 주입 및 재생 (2단계)
// ============================================================================
function loadAndPlay(videoId) {
  shouldPlay = true; // [중요] "나 재생할 거야!" 선언

  if (!isReady) {
    currentVideoId = videoId;
    return;
  }

  console.log(`[Offscreen] Phase 2: Injecting Video ${videoId}`);
  currentVideoId = videoId;

  sendCommand('loadVideoById', [{
    'videoId': videoId,
    'startSeconds': 0,
    'suggestedQuality': 'small'
  }]);

  startRetryPlayback();
}

function startRetryPlayback() {
  stopRetry(); 
  retryInterval = setInterval(() => {
    if (shouldPlay) {
        sendCommand('playVideo');
        // 소리는 확실히 재생된 후에 켜는 게 안전하지만,
        // 일단 사용자 경험을 위해 같이 보냄.
        // 만약 이것 때문에 멈추면 좀비 로직이 되살릴 것임.
        sendCommand('unMute'); 
        sendCommand('setVolume', [50]);
    }
  }, 800);
}

function stopRetry() {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
}

// ============================================================================
// [4] 명령 전송
// ============================================================================
function sendCommand(command, args = []) {
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({ 
    event: 'command', 
    func: command, 
    args: args 
  }), '*');
}

// ============================================================================
// [5] 백그라운드 통신
// ============================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== TARGETS.OFFSCREEN) return;

  if (msg.action === 'PING') {
    sendResponse({ status: 'ALIVE' });
    return;
  }

  try {
    switch (msg.action) {
      case ACTIONS.PLAY_NEW: 
        if (!msg.payload || !msg.payload.videoId) {
            shouldPlay = false; // 정지 의도
            sendCommand('stopVideo'); // stopVideo는 완전 정지라 다음에 재생 안 될 수 있음
            // pauseVideo가 더 안전할 수 있음
            sendCommand('pauseVideo');
            stopRetry();
            return;
        }
        if (!iframe) createIframe(msg.payload.videoId);
        else loadAndPlay(msg.payload.videoId);
        break;
        
      case ACTIONS.TOGGLE_PLAY:
        // 토글 명령이 왔다는 건, 사용자가 재생을 원한다는 뜻으로 해석
        // (정지를 원할 땐 UI가 정지 아이콘 상태에서 누를 테니)
        // 하지만 정확히는 현재 상태를 보고 반대로 해야 함.
        // 일단 "재생"을 강제하는 쪽으로 유도.
        shouldPlay = true;
        sendCommand('playVideo'); 
        break;
        
      case ACTIONS.SET_VOLUME: 
        if (typeof msg.payload.volume === 'number') {
            sendCommand('setVolume', [msg.payload.volume]);
        }
        break;

      case ACTIONS.TOGGLE_MUTE:
        if (msg.payload && typeof msg.payload.mute === 'boolean') {
           if (msg.payload.mute) sendCommand('mute');
           else sendCommand('unMute');
        }
        break;
        
      case ACTIONS.SEEK:
        sendCommand('seekTo', [msg.payload.time, true]);
        break;
    }
  } catch (err) {
    console.error('[Offscreen] Action Error:', err);
  }
});

// ============================================================================
// [6] 유튜브 이벤트 리스너 (좀비 모드 탑재)
// ============================================================================
window.addEventListener('message', (e) => {
  try {
      if (typeof e.data !== 'string') return;
      const data = JSON.parse(e.data);
      
      // Handshake Success
      if (['onReady', 'initialDelivery'].includes(data.event) && !isReady) {
          console.log('[Offscreen] Handshake SUCCESS! Player Ready.');
          isReady = true;
          stopHandshake();
          chrome.runtime.sendMessage({ target: TARGETS.BACKGROUND, action: ACTIONS.OFFSCREEN_READY });
          if (currentVideoId) loadAndPlay(currentVideoId);
      }

      // Info Delivery
      if (data.event === 'infoDelivery' && data.info) {
          const info = data.info;
          
          if (info.error) {
              stopRetry(); // 에러는 좀비 로직 적용 불가 (진짜 못 트는 거니까)
              let errorMsg = `YouTube Error: ${info.error}`;
              if (info.error === 150 || info.error === 101) errorMsg = "재생 불가 (보안 제한)";
              
              chrome.runtime.sendMessage({
                  target: TARGETS.BACKGROUND,
                  action: ACTIONS.SHOW_ERROR,
                  payload: { message: errorMsg }
              });
              return;
          }

          if (info.playerState !== undefined) {
              const state = info.playerState;
              const isPlaying = (state === 1);
              const isPaused = (state === 2);
              const isBuffering = (state === 3);
              const isEnded = (state === 0);
              
              // [좀비 로직 발동!]
              // 우리는 재생하길 원하는데(shouldPlay), 
              // 플레이어가 멈추거나(Paused) 끝났다(Ended)고 하면?
              if (shouldPlay && (isPaused || isEnded)) {
                  console.warn('[Offscreen] Detected unexpected Pause! ZOMBIE MODE: Forcing Play...');
                  // 즉시 다시 찌르기 시작
                  startRetryPlayback();
                  // 명령 바로 전송
                  sendCommand('playVideo');
                  // 여기서 return 하지 않고 상태 업데이트는 보냄 (UI가 잠깐 깜빡이더라도)
              } 
              
              // 정상 재생 중이면 찌르기 중단 (리소스 절약)
              // 단, 확실하게 하기 위해 Buffering 중에는 계속 찌름
              else if (isPlaying) {
                  stopRetry();
              }

              chrome.runtime.sendMessage({
                  target: TARGETS.BACKGROUND,
                  action: ACTIONS.OFFSCREEN_STATE_UPDATE,
                  payload: { 
                      state: isPlaying ? CONFIG.PLAYER.STATE_PLAYING : CONFIG.PLAYER.STATE_PAUSED,
                      ended: isEnded
                  }
              });
          }

          if (info.currentTime) {
              chrome.runtime.sendMessage({
                  target: TARGETS.BACKGROUND,
                  action: ACTIONS.OFFSCREEN_STATE_UPDATE,
                  payload: { 
                      currentTime: info.currentTime,
                      duration: info.duration || 0,
                      isMuted: info.muted
                  }
              });
          }
      }
  } catch (err) {}
});