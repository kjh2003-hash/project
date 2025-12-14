import config from "./apikey.js";

const API_KEY = config.NEWS_API_KEY;

const playBtn = document.getElementById("play-btn");
const playIcon = document.getElementById("play-icon");

const firstBtn = document.getElementById("first-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const lastBtn = document.getElementById("last-btn");

const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const progressFill = document.getElementById("progress-fill");
const titleEl = document.getElementById("track-title");

const searchView = document.getElementById("search-view");
const playlistView = document.getElementById("playlist-view");

const searchToggle = document.getElementById("search-toggle");
const listToggle = document.getElementById("list-toggle");
const playerToggle = document.getElementById("player-toggle");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const searchResultsEl = document.getElementById("search-results");
const playlistListEl = document.getElementById("playlist-list");

function showPlayer() {
  searchView.classList.add("hidden");
  playlistView.classList.add("hidden");
  playerToggle.classList.add("hidden");
}

function showSearch() {
  searchView.classList.remove("hidden");
  playlistView.classList.add("hidden");
  playerToggle.classList.remove("hidden");
}

function showPlaylist() {
  playlistView.classList.remove("hidden");
  searchView.classList.add("hidden");
  playerToggle.classList.remove("hidden");
}

searchToggle.onclick = showSearch;
listToggle.onclick = showPlaylist;
playerToggle.onclick = showPlayer;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let player;
let progressTimer = null;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player", {
    height: "1",
    width: "1",
    videoId: "",
    playerVars: {
      controls: 0,
      rel: 0,
    },
    events: {
      onReady: () => {
        console.log("YT Player Ready");
      },
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerStateChange(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    playIcon.innerHTML = `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="10" y1="8" x2="10" y2="16"></line>
      <line x1="14" y1="8" x2="14" y2="16"></line>
    `;
    startProgress();
  } else {
    playIcon.innerHTML = `
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="10 8 16 12 10 16 10 8"></polygon>
    `;
    stopProgress();
  }
}

playBtn.onclick = () => {
  if (!player) return;
  const state = player.getPlayerState();
  if (state !== YT.PlayerState.PLAYING) {
    player.playVideo();
  } else {
    player.pauseVideo();
  }
};

function startProgress() {
  if (progressTimer) return;
  progressTimer = setInterval(() => {
    if (!player) return;

    const current = player.getCurrentTime();
    const total = player.getDuration();
    if (!total) return;

    currentTimeEl.textContent = formatTime(current);
    totalTimeEl.textContent = formatTime(total);
    progressFill.style.width = `${(current / total) * 100}%`;
  }, 500);
}

function stopProgress() {
  clearInterval(progressTimer);
  progressTimer = null;
}

const playlist = [];
let currentIndex = 0;

function addToPlaylist(videoId, title) {
  playlist.push({ videoId, title });
  renderPlaylist();
}

function renderPlaylist() {
  playlistListEl.innerHTML = "";
  playlist.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "playlist-item";
    div.textContent = item.title;
    div.onclick = () => playFromPlaylist(index);
    playlistListEl.appendChild(div);
  });
}

function playFromPlaylist(index) {
  if (!playlist[index] || !player) return;
  currentIndex = index;
  titleEl.textContent = playlist[index].title;
  player.loadVideoById(playlist[index].videoId);
  showPlayer();
}

prevBtn.onclick = () => {
  if (currentIndex > 0) playFromPlaylist(currentIndex - 1);
};

nextBtn.onclick = () => {
  if (currentIndex < playlist.length - 1)
    playFromPlaylist(currentIndex + 1);
};

firstBtn.onclick = () => {
  if (playlist.length > 0) playFromPlaylist(0);
};

lastBtn.onclick = () => {
  if (playlist.length > 0)
    playFromPlaylist(playlist.length - 1);
};

searchBtn.onclick = () => {
  const query = searchInput.value.trim();
  if (!query) return;
  searchYouTube(query);
};

async function searchYouTube(query) {
  searchResultsEl.innerHTML = "검색 중...";

  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet&type=video&maxResults=5` +
    `&q=${encodeURIComponent(query)}` +
    `&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    renderSearchResults(data.items || []);
  } catch (e) {
    console.error(e);
    searchResultsEl.innerHTML = "검색 실패";
  }
}

function renderSearchResults(items) {
  searchResultsEl.innerHTML = "";

  items.forEach(item => {
    if (!item.id.videoId) return;

    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails.medium.url;

    const div = document.createElement("div");
    div.className = "result-item";

    div.innerHTML = `
      <img src="${thumbnail}" />
      <div class="title">${title}</div>
      <button class="add-btn" data-saved="false">
        <svg viewBox="0 0 24 24">
          <path d="M12 3v12"></path>
          <path d="M8 11l4 4 4-4"></path>
          <path d="M4 21h16"></path>
        </svg>
      </button>
    `;

    const addBtn = div.querySelector(".add-btn");

    addBtn.onclick = (e) => {
      e.stopPropagation();
      
      if (addBtn.dataset.saved === "true") return;

      addToPlaylist(videoId, title);

      addBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      `;
      addBtn.dataset.saved = "true";
    };

    searchResultsEl.appendChild(div);
  });
}

document.getElementById("search-back-btn").onclick = showPlayer;

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

