let bgPlaylist = [];
let currentPlayback = null;
let offscreenCreating = false;

chrome.storage.local.get(["bgPlaylist"], (res) => {
  if (Array.isArray(res.bgPlaylist)) {
    bgPlaylist = res.bgPlaylist;
  }
});

async function ensurePlayer() {
  if (offscreenCreating) {
    while (offscreenCreating) {
      await new Promise(r => setTimeout(r, 50));
    }
    return;
  }

  const exists = await chrome.offscreen.hasDocument();
  if (exists) return;

  offscreenCreating = true;
  console.log("CREATING OFFSCREEN PLAYER");

  await chrome.offscreen.createDocument({
    url: "player.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "YouTube background playback"
  });

  offscreenCreating = false;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("BG RECEIVED:", msg);

  if (msg.type === "SYNC_PLAYLIST") {
    bgPlaylist = msg.playlist;
    chrome.storage.local.set({ bgPlaylist });
    return;
  }

  if (msg.type === "PLAY_VIDEO") {
    (async () => {
      currentPlayback = { videoId: msg.videoId };

      await ensurePlayer();

      await new Promise(r => setTimeout(r, 300));

      chrome.runtime.sendMessage({
        type: "PLAY_VIDEO",
        videoId: msg.videoId
      });
    })();

    return true; 
  }

  if (msg.type === "GET_PLAYLIST") {
    if (bgPlaylist.length === 0) {
      chrome.storage.local.get(["bgPlaylist"], (res) => {
        sendResponse({
          playlist: Array.isArray(res.bgPlaylist) ? res.bgPlaylist : []
        });
      });
      return true;
    }

    sendResponse({ playlist: bgPlaylist });
    return true;
  }

  if (msg.type === "CLEAR_PLAYLIST") {
    bgPlaylist = [];
    chrome.storage.local.set({ bgPlaylist: [] });
    return;
  }
});


let playerTabId = null;

function openOrUpdatePlayer(videoId) {
  if (playerTabId !== null) {
    chrome.tabs.sendMessage(playerTabId, {
      type: "PLAY",
      videoId
    });
    return;
  }

  chrome.tabs.create(
    {
      url: chrome.runtime.getURL("player.html"),
      active: false
    },
    (tab) => {
      playerTabId = tab.id;

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === playerTabId && info.status === "complete") {
          chrome.tabs.sendMessage(playerTabId, {
            type: "PLAY",
            videoId
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
  );
}