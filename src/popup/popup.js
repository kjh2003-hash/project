import { YouTubeAPI } from '../common/api.js';
import { debounce, formatTime, safeSendMessage } from '../common/utils.js';
import { ACTIONS, TARGETS, CONFIG, DOM_SELECTORS, UI_TEXT, TABS, EVENT_TYPES } from '../constants/index.js';

// ============================================================================
// [1] 메인 초기화 (DOM 로드 후 실행)
// ============================================================================
document.addEventListener(EVENT_TYPES.DOM_CONTENT_LOADED, async () => {
  const { IDS, CLASSES, PREFIXES, STYLES } = DOM_SELECTORS;
  
  // HTML 요소들을 미리 찾아서 변수에 담아둠. (매번 찾으면 느림)
  const UI = {
    tabs: document.querySelectorAll(`.${CLASSES.NAV_BTN}`),
    sections: document.querySelectorAll(`.${CLASSES.TAB_CONTENT}`),
    playBtn: document.getElementById(IDS.BTN_PLAY_PAUSE),
    prevBtn: document.getElementById(IDS.BTN_PREV),
    nextBtn: document.getElementById(IDS.BTN_NEXT),
    shuffleBtn: document.getElementById(IDS.BTN_SHUFFLE),
    repeatBtn: document.getElementById(IDS.BTN_REPEAT),
    muteBtn: document.getElementById(IDS.BTN_MUTE),
    title: document.getElementById(IDS.TRACK_TITLE),
    channel: document.getElementById(IDS.CHANNEL_NAME),
    thumb: document.getElementById(IDS.MAIN_THUMBNAIL),
    progress: document.getElementById(IDS.PROGRESS_BAR),
    currTime: document.getElementById(IDS.CURRENT_TIME),
    totalTime: document.getElementById(IDS.TOTAL_TIME),
    searchIn: document.getElementById(IDS.SEARCH_INPUT),
    searchResults: document.getElementById(IDS.SEARCH_RESULTS),
    queueContainer: document.getElementById(IDS.QUEUE_CONTAINER),
    queueCount: document.getElementById(IDS.QUEUE_COUNT),
    btnCleared: document.getElementById(IDS.BTN_CLEAR_ALL),
    volumeSlider: document.getElementById(IDS.VOLUME_SLIDER),
    toastContainer: document.getElementById(IDS.TOAST_CONTAINER),
    btnOpenOptions: document.getElementById(IDS.BTN_OPEN_OPTIONS)
  };

  // 마지막 상태를 기억해서, 변한 게 없으면 화면을 안 바꾸기 위함.
  let lastState = { 
    queueIds: '',     
    currentTrackId: null, 
    isPlaying: null,
    currentIndex: -1,
    isShuffle: false,
    repeatMode: null,
    isMuted: false,
    duration: 0
  };
  
  let currentSlidItem = null; // 슬라이드로 열린 아이템 기억

  // ============================================================================
  // [2] 헬퍼 함수들 (아이콘, 토스트, 탭 전환)
  // ============================================================================

  // data-icon 속성이 있는 요소에 SVG 아이콘을 넣어주는 함수
  const initIcons = () => {
    document.querySelectorAll('[data-icon]').forEach(el => {
      const key = el.dataset.icon;
      const svgCode = CONFIG.UI_ICONS[key];
      if (svgCode) {
        el.innerHTML = ''; 
        const iconWrapper = document.createElement('span');
        iconWrapper.className = CLASSES.UI_ICON_ASSET;
        iconWrapper.innerHTML = svgCode; 
        el.prepend(iconWrapper);
      }
    });
  };

  // 백그라운드로 명령을 보내는 함수
  const sendAction = (action, payload = {}) => {
    return safeSendMessage({ target: TARGETS.BACKGROUND, action, payload });
  };

  // 하단 팝업 메시지(토스트) 띄우기
  const showToast = (message) => {
    if (!UI.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = CLASSES.TOAST;
    toast.textContent = message;
    
    // 에러 메시지면 빨간색으로
    if (message.includes('Error') || message.includes('실패') || message.includes('오류')) {
        toast.style.borderColor = '#ff2d55';
        toast.style.color = '#ff99aa';
    }

    UI.toastContainer.appendChild(toast);
    void toast.offsetWidth; // 리플로우 강제 (애니메이션 트리거)
    
    setTimeout(() => toast.classList.add(CLASSES.TOAST_SHOW), CONFIG.TIMING.TOAST_FADE_IN);
    setTimeout(() => {
      toast.classList.remove(CLASSES.TOAST_SHOW);
      setTimeout(() => toast.remove(), CONFIG.TIMING.TOAST_REMOVE_DELAY);
    }, CONFIG.TIMING.TOAST_DURATION);
  };

  // 탭 전환 (플레이어 <-> 큐 <-> 검색 <-> 설정)
  const switchTab = (target) => {
    UI.tabs.forEach(t => t.classList.toggle(CLASSES.ACTIVE, t.dataset.target === target));
    UI.sections.forEach(s => s.classList.toggle(CLASSES.ACTIVE, s.id === `${PREFIXES.TAB_SECTION}${target}`));
    // 검색 탭인데 입력값 없으면 추천 카테고리 보여주기
    if (target === TABS.SEARCH && (!UI.searchIn?.value || UI.searchIn.value.trim() === '')) {
      renderCategories();
    }
  };

  // ============================================================================
  // [3] UI 동기화 (백그라운드 상태 -> 화면 반영)
  // 가장 중요한 함수. 상태가 바뀔 때만 화면을 고침.
  // ============================================================================
  const syncUI = (state) => {
    const currentTrack = state.queue?.[state.currentIndex];
    
    // 1. 곡 정보 업데이트
    if (currentTrack?.videoId !== lastState.currentTrackId) {
      if (UI.title) UI.title.textContent = currentTrack?.title || UI_TEXT.DEFAULT_TITLE;
      if (UI.channel) UI.channel.textContent = currentTrack?.channel || UI_TEXT.DEFAULT_CHANNEL;
      
      if (UI.thumb) {
          UI.thumb.src = currentTrack?.thumbnail || CONFIG.FALLBACK_THUMB;
          UI.thumb.onerror = () => { UI.thumb.src = CONFIG.FALLBACK_THUMB; };
      }
      lastState.currentTrackId = currentTrack?.videoId;
    }
    
    // 2. 재생 버튼 아이콘 (재생중/일시정지)
    if (state.isPlaying !== lastState.isPlaying && UI.playBtn) {
      const iconWrapper = UI.playBtn.querySelector(`.${CLASSES.UI_ICON_ASSET}`);
      if (iconWrapper) {
          iconWrapper.innerHTML = state.isPlaying ? CONFIG.UI_ICONS.PAUSE : CONFIG.UI_ICONS.PLAY;
      }
      lastState.isPlaying = state.isPlaying;
    }

    // 3. 셔플 버튼 스타일
    if (state.isShuffle !== lastState.isShuffle && UI.shuffleBtn) {
      UI.shuffleBtn.style.color = state.isShuffle ? STYLES.ACCENT_COLOR : STYLES.TEXT_SECONDARY;
      lastState.isShuffle = state.isShuffle;
    }

    // 4. 반복 버튼 스타일
    if (state.repeatMode !== lastState.repeatMode && UI.repeatBtn) {
      const isActive = state.repeatMode !== CONFIG.REPEAT_MODES.OFF;
      UI.repeatBtn.style.color = isActive ? STYLES.ACCENT_COLOR : STYLES.TEXT_SECONDARY;
      lastState.repeatMode = state.repeatMode;
    }

    // 5. 음소거 및 볼륨 UI
    if (state.isMuted !== lastState.isMuted && UI.muteBtn) {
       const iconWrapper = UI.muteBtn.querySelector(`.${CLASSES.UI_ICON_ASSET}`);
       if (iconWrapper) {
          iconWrapper.innerHTML = state.isMuted ? CONFIG.UI_ICONS.MUTE : CONFIG.UI_ICONS.VOLUME;
       }
       if (UI.volumeSlider) {
         UI.volumeSlider.style.opacity = state.isMuted ? STYLES.OPACITY_DIM : STYLES.OPACITY_FULL;
       }
       lastState.isMuted = state.isMuted;
    }

    if (state.volume !== undefined && UI.volumeSlider && !state.isMuted) {
        UI.volumeSlider.value = state.volume;
    }
    
    // 6. 큐 리스트 업데이트 (목록이 바뀌었을 때만 다시 그리기)
    const newQueueIds = state.queue.map(item => item.videoId).join(',');
    
    if (newQueueIds !== lastState.queueIds) {
      renderQueueFull(state.queue, state.currentIndex);
      lastState.queueIds = newQueueIds;
    } else if (state.currentIndex !== lastState.currentIndex) {
      updateQueueActiveState(state.currentIndex);
    }
    lastState.currentIndex = state.currentIndex;

    // 7. 진행바 및 시간 텍스트
    if (state.duration > 0) {
      if (UI.progress) UI.progress.value = (state.currentTime / state.duration) * 100;
      if (UI.currTime) UI.currTime.textContent = formatTime(state.currentTime);
      if (UI.totalTime) UI.totalTime.textContent = formatTime(state.duration);
    }
  };

  // ============================================================================
  // [4] 렌더링 함수들 (HTML 요소 만들기)
  // ============================================================================

  // 큐(재생목록) 전체 그리기
  const renderQueueFull = (queue, currentIndex) => {
    if (!UI.queueContainer) return;
    UI.queueContainer.innerHTML = '';
    if (UI.queueCount) UI.queueCount.textContent = queue.length;

    if (queue.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = CLASSES.CENTER_MESSAGE;
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '40px';
      emptyMsg.style.color = 'rgba(255,255,255,0.4)';
      emptyMsg.textContent = UI_TEXT.EMPTY_QUEUE;
      UI.queueContainer.appendChild(emptyMsg);
      return;
    }

    const fragment = document.createDocumentFragment();
    queue.forEach((item, index) => {
      const isPlaying = index === currentIndex;
      
      const itemEl = document.createElement('div');
      itemEl.className = `${CLASSES.SEARCH_ITEM_WRAPPER} ${isPlaying ? CLASSES.ACTIVE_TRACK : ''}`;
      itemEl.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = CLASSES.SEARCH_ITEM_INNER;
      
      const content = document.createElement('div');
      content.className = CLASSES.SEARCH_ITEM_CONTENT;
      
      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.onerror = () => { img.src = CONFIG.FALLBACK_THUMB; };
      
      const info = document.createElement('div');
      info.className = CLASSES.SEARCH_ITEM_INFO;
      
      const title = document.createElement('h4');
      title.textContent = item.title;
      if (isPlaying) {
        title.className = CLASSES.PLAYING_TITLE;
        title.style.color = STYLES.ACCENT_COLOR;
      }

      const channel = document.createElement('p');
      channel.textContent = item.channel;
      
      info.appendChild(title);
      info.appendChild(channel);
      content.appendChild(img);
      content.appendChild(info);

      if (isPlaying) {
         const label = document.createElement('span');
         label.className = CLASSES.PLAYING_LABEL;
         label.style.color = STYLES.ACCENT_COLOR;
         label.style.fontSize = '10px';
         label.style.fontWeight = '800';
         label.textContent = UI_TEXT.LABEL_PLAYING;
         content.appendChild(label);
      }

      // 슬라이드 시 나타나는 버튼들
      const actions = document.createElement('div');
      actions.className = CLASSES.SEARCH_ITEM_ACTIONS;
      
      const playBtn = createActionButton(CLASSES.BTN_ACTION_PLAY, CONFIG.UI_ICONS.PLAY, async (e) => {
         e.stopImmediatePropagation();
         await sendAction(ACTIONS.PLAY_NEW, item);
         itemEl.classList.remove(CLASSES.SLIDE_ACTIVE);
         switchTab(TABS.PLAYER);
      });

      const deleteBtn = createActionButton(CLASSES.BTN_ACTION_DELETE, CONFIG.UI_ICONS.DELETE, async (e) => {
         e.stopImmediatePropagation();
         itemEl.classList.remove(CLASSES.SLIDE_ACTIVE);
         await sendAction(ACTIONS.REMOVE_FROM_QUEUE, { index });
      });

      actions.appendChild(playBtn);
      actions.appendChild(deleteBtn);
      
      inner.appendChild(content);
      inner.appendChild(actions);
      itemEl.appendChild(inner);

      // 클릭 시 슬라이드 토글
      itemEl.onclick = () => {
        if (currentSlidItem && currentSlidItem !== itemEl) {
          currentSlidItem.classList.remove(CLASSES.SLIDE_ACTIVE);
        }
        itemEl.classList.toggle(CLASSES.SLIDE_ACTIVE);
        currentSlidItem = itemEl.classList.contains(CLASSES.SLIDE_ACTIVE) ? itemEl : null;
      };

      fragment.appendChild(itemEl);
    });
    UI.queueContainer.appendChild(fragment);
  };

  // 큐에서 현재 재생 중인 곡만 하이라이트 변경 (전체 다시 그리기 방지)
  const updateQueueActiveState = (newIndex) => {
    if (!UI.queueContainer) return;
    const items = Array.from(UI.queueContainer.children);
    
    items.forEach((item, idx) => {
        const isNowPlaying = idx === newIndex;
        const titleEl = item.querySelector('h4');
        const labelEl = item.querySelector(`.${CLASSES.PLAYING_LABEL}`);

        if (isNowPlaying) {
            item.classList.add(CLASSES.ACTIVE_TRACK);
            if(titleEl) {
                titleEl.classList.add(CLASSES.PLAYING_TITLE);
                titleEl.style.color = STYLES.ACCENT_COLOR;
            }
            if (!labelEl) {
                const content = item.querySelector(`.${CLASSES.SEARCH_ITEM_CONTENT}`);
                if (content) {
                    const label = document.createElement('span');
                    label.className = CLASSES.PLAYING_LABEL;
                    label.style.color = STYLES.ACCENT_COLOR;
                    label.style.fontSize = '10px';
                    label.style.fontWeight = '800';
                    label.textContent = UI_TEXT.LABEL_PLAYING;
                    content.appendChild(label);
                }
            }
        } else {
            item.classList.remove(CLASSES.ACTIVE_TRACK);
            if(titleEl) {
                titleEl.classList.remove(CLASSES.PLAYING_TITLE);
                titleEl.style.color = '';
            }
            if(labelEl) labelEl.remove();
        }
    });
  };

  // 액션 버튼 생성 도우미
  const createActionButton = (className, iconSvg, onClick) => {
      const btn = document.createElement('button');
      btn.className = `btn-action ${className}`;
      const iconSpan = document.createElement('span');
      iconSpan.className = CLASSES.UI_ICON_ASSET;
      iconSpan.innerHTML = iconSvg;
      btn.appendChild(iconSpan);
      btn.onclick = onClick;
      return btn;
  };

  // 추천 카테고리 칩 그리기
  const renderCategories = () => {
    if (!UI.searchResults) return;
    UI.searchResults.innerHTML = '';
    const container = document.createElement('div');
    container.className = CLASSES.CATEGORY_CONTAINER;
    
    const header = document.createElement('div');
    header.style = 'width:100%; font-size:11px; font-weight:700; color:var(--text-dim); margin-bottom:12px; padding-left:4px;';
    header.textContent = UI_TEXT.RECOMMENDED_HEADER;
    container.appendChild(header);

    CONFIG.SEARCH_CATEGORIES.forEach(cat => {
      const chip = document.createElement('div');
      chip.className = CLASSES.CATEGORY_CHIP;
      chip.textContent = cat.label;
      chip.onclick = (e) => {
        e.stopPropagation();
        if (UI.searchIn) UI.searchIn.value = cat.label;
        performSearch(cat.query);
      };
      container.appendChild(chip);
    });
    UI.searchResults.appendChild(container);
  };

  // 검색 결과 리스트 그리기
  const renderSearchResults = (results) => {
    if (!UI.searchResults) return;
    UI.searchResults.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    results.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = CLASSES.SEARCH_ITEM_WRAPPER;
      
      const inner = document.createElement('div');
      inner.className = CLASSES.SEARCH_ITEM_INNER;

      const content = document.createElement('div');
      content.className = CLASSES.SEARCH_ITEM_CONTENT;
      
      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.onerror = () => { img.src = CONFIG.FALLBACK_THUMB; };

      const info = document.createElement('div');
      info.className = CLASSES.SEARCH_ITEM_INFO;
      
      const title = document.createElement('h4');
      title.textContent = item.title;
      const channel = document.createElement('p');
      channel.textContent = item.channel;

      info.appendChild(title);
      info.appendChild(channel);
      content.appendChild(img);
      content.appendChild(info);

      const actions = document.createElement('div');
      actions.className = CLASSES.SEARCH_ITEM_ACTIONS;
      
      const playBtn = createActionButton(CLASSES.BTN_ACTION_PLAY, CONFIG.UI_ICONS.PLAY, async (e) => {
        e.stopImmediatePropagation();
        await sendAction(ACTIONS.PLAY_NEW, item);
        switchTab(TABS.PLAYER);
      });

      const addBtn = createActionButton(CLASSES.BTN_ACTION_ADD, CONFIG.UI_ICONS.ADD, async (e) => {
        e.stopImmediatePropagation();
        const res = await sendAction(ACTIONS.ADD_TO_QUEUE, item);
        wrapper.classList.remove(CLASSES.SLIDE_ACTIVE);
        
        if (res.success && res.added) {
          showToast(UI_TEXT.ADDED_TO_QUEUE);
        } else if (res.success && res.reason === 'duplicate') {
          showToast(UI_TEXT.MSG_ALREADY_IN_QUEUE);
        } else {
          showToast(`Error: ${res.error || 'Unknown'}`);
        }
      });

      actions.appendChild(playBtn);
      actions.appendChild(addBtn);

      inner.appendChild(content);
      inner.appendChild(actions);
      wrapper.appendChild(inner);
      
      wrapper.onclick = () => {
        if (currentSlidItem && currentSlidItem !== wrapper) {
          currentSlidItem.classList.remove(CLASSES.SLIDE_ACTIVE);
        }
        wrapper.classList.toggle(CLASSES.SLIDE_ACTIVE);
        currentSlidItem = wrapper.classList.contains(CLASSES.SLIDE_ACTIVE) ? wrapper : null;
      };
      fragment.appendChild(wrapper);
    });
    UI.searchResults.appendChild(fragment);
  };

  // 실제 검색 수행
  const performSearch = async (query) => {
    if (!query?.trim()) { renderCategories(); return; }
    
    UI.searchResults.innerHTML = '';
    const msg = document.createElement('p');
    msg.style.textAlign = 'center'; msg.style.padding = '40px';
    msg.textContent = UI_TEXT.SEARCHING;
    UI.searchResults.appendChild(msg);
    
    try {
      const results = await YouTubeAPI.search(query);
      if (!results?.length) {
        msg.textContent = UI_TEXT.NO_RESULTS;
        return;
      }
      renderSearchResults(results);
    } catch (e) {
      msg.textContent = `검색 실패: ${e.message}`;
      msg.style.color = STYLES.ACCENT_COLOR;
    }
  };

  // 검색 디바운싱 (타이핑 멈추면 검색)
  const debouncedSearch = debounce((val) => performSearch(val), CONFIG.TIMING.DEBOUNCE_DELAY);

  // ============================================================================
  // [5] 이벤트 리스너 등록
  // 버튼 클릭, 입력 등 사용자 행동을 연결.
  // ============================================================================
  
  // 초기 아이콘 로드
  initIcons();
  
  // 검색창 입력 이벤트
  UI.searchIn?.addEventListener(EVENT_TYPES.INPUT, (e) => debouncedSearch(e.target.value));
  
  // 하단 탭 버튼 이벤트
  UI.tabs.forEach(tab => tab.addEventListener(EVENT_TYPES.CLICK, () => switchTab(tab.dataset.target)));
  
  // 재생 컨트롤 버튼들
  UI.playBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.TOGGLE_PLAY));
  UI.prevBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.PREV_TRACK));
  UI.nextBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.NEXT_TRACK));
  UI.shuffleBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.TOGGLE_SHUFFLE));
  UI.repeatBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.TOGGLE_REPEAT));
  UI.muteBtn?.addEventListener(EVENT_TYPES.CLICK, () => sendAction(ACTIONS.TOGGLE_MUTE));
  
  // 볼륨 슬라이더
  UI.volumeSlider?.addEventListener(EVENT_TYPES.INPUT, (e) => {
    sendAction(ACTIONS.SET_VOLUME, { volume: Number(e.target.value) });
  });
  
  // 설정 페이지 열기 버튼
  UI.btnOpenOptions?.addEventListener(EVENT_TYPES.CLICK, () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('src/options/options.html'));
    }
  });

  // 큐 비우기 버튼
  UI.btnCleared?.addEventListener(EVENT_TYPES.CLICK, async () => {
    await sendAction(ACTIONS.CLEAR_QUEUE);
    showToast(UI_TEXT.MSG_QUEUE_CLEARED);
  });

  // 백그라운드로부터 메시지 수신 (상태 동기화, 에러 표시)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.target !== TARGETS.POPUP) return;
    
    if (msg.action === ACTIONS.SHOW_ERROR && msg.payload?.message) {
        showToast(`🚨 ${msg.payload.message}`);
        return;
    }
    
    if (msg.action === ACTIONS.SYNC_UI) {
        syncUI(msg.payload);
    }
  });
  
  // 팝업 켜지자마자 현재 상태 달라고 요청
  sendAction(ACTIONS.GET_CURRENT_STATE);
});