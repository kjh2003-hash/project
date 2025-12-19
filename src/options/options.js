import { StorageManager } from '../common/storage.js';
import { STORAGE_KEYS, CONFIG, DOM_SELECTORS, UI_TEXT, EVENT_TYPES } from '../constants/index.js';

document.addEventListener(EVENT_TYPES.DOM_CONTENT_LOADED, async () => {
  const { IDS, CLASSES, PREFIXES } = DOM_SELECTORS;
  
  const UI = {
    navItems: document.querySelectorAll(`.${CLASSES.NAV_ITEM}`),
    sections: document.querySelectorAll(`.${CLASSES.CONTENT_SECTION}`),
    historyBody: document.getElementById(IDS.HISTORY_BODY),
    btnClearHistory: document.getElementById(IDS.BTN_CLEAR_HISTORY),
    btnSync: document.getElementById(IDS.BTN_SYNC),
    modal: document.getElementById(IDS.CONFIRM_MODAL),
    modalMsg: document.getElementById(IDS.MODAL_MESSAGE),
    modalConfirm: document.getElementById(IDS.MODAL_CONFIRM),
    modalCancel: document.getElementById(IDS.MODAL_CANCEL)
  };

  let modalCallback = null;

  const showConfirm = (msg, callback) => {
    if (!UI.modal) return;
    UI.modalMsg.textContent = msg;
    UI.modal.classList.add(CLASSES.MODAL_VISIBLE);
    modalCallback = callback;
  };

  const hideModal = () => {
    UI.modal.classList.remove(CLASSES.MODAL_VISIBLE);
    modalCallback = null;
  };

  UI.modalConfirm.onclick = () => {
    if (modalCallback) modalCallback();
    hideModal();
  };
  UI.modalCancel.onclick = hideModal;

  const switchSection = (target) => {
    UI.navItems.forEach(i => i.classList.toggle(CLASSES.ACTIVE, i.dataset.section === target));
    UI.sections.forEach(s => s.classList.toggle(CLASSES.ACTIVE, s.id === `${PREFIXES.CONTENT_SECTION}${target}`));
  };

  UI.navItems.forEach(item => {
    item.addEventListener(EVENT_TYPES.CLICK, () => switchSection(item.dataset.section));
  });

  async function loadHistory() {
    if (!UI.historyBody) return;
    const history = await StorageManager.get(STORAGE_KEYS.HISTORY, []);
    UI.historyBody.innerHTML = '';

    if (history.length === 0) {
      UI.historyBody.innerHTML = UI_TEXT.EMPTY_HISTORY_ROW;
      return;
    }

    const fragment = document.createDocumentFragment();
    history.forEach((item, index) => {
      const row = document.createElement('tr');
      // onerror 핸들러 제거
      row.innerHTML = `
        <td>${new Date().toLocaleDateString()}</td>
        <td style="display:flex; align-items:center; gap:10px;">
          <img src="${item.thumbnail}" style="width:40px; border-radius:4px;">
          <span>${item.title}</span>
        </td>
        <td><button class="${CLASSES.BTN_DANGER_SMALL}" data-index="${index}">삭제</button></td>
      `;
      row.querySelector(`.${CLASSES.BTN_DANGER_SMALL}`).onclick = () => {
        showConfirm(UI_TEXT.CONFIRM_DELETE_ITEM, async () => {
          let h = await StorageManager.get(STORAGE_KEYS.HISTORY, []);
          h.splice(index, 1);
          await StorageManager.set(STORAGE_KEYS.HISTORY, h);
          loadHistory();
        });
      };
      fragment.appendChild(row);
    });
    UI.historyBody.appendChild(fragment);
  }

  if (UI.btnClearHistory) {
    UI.btnClearHistory.onclick = () => {
      showConfirm(UI_TEXT.CONFIRM_CLEAR_HISTORY, async () => {
        await StorageManager.set(STORAGE_KEYS.HISTORY, []);
        loadHistory();
      });
    };
  }

  if (UI.btnSync) {
    UI.btnSync.onclick = () => {
      UI.btnSync.textContent = UI_TEXT.SYNCING;
      setTimeout(() => {
        UI.btnSync.textContent = UI_TEXT.SYNC_DONE;
        setTimeout(() => UI.btnSync.textContent = UI_TEXT.SYNC_BTN_LABEL, CONFIG.TIMING.SYNC_RESET);
      }, CONFIG.TIMING.SYNC_FEEDBACK);
    };
  }

  loadHistory();
});