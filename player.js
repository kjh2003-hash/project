let player;
let currentVideoId = null;

window.addEventListener("message", (e) => {
  if (e.data.type === "PLAY") {
    loadVideo(e.data.videoId);
  }
});

function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player", {
    height: "0",
    width: "0",
    playerVars: {
      controls: 0,
      rel: 0
    }
  });
}

function loadVideo(videoId) {
  currentVideoId = videoId;
  player.loadVideoById(videoId);
}