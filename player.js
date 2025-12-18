console.log("PLAYER SCRIPT LOADED");

let iframe = null;
const ORIGIN = location.origin;

window.addEventListener("DOMContentLoaded", () => {
  iframe = document.getElementById("yt-player");
  console.log("PLAYER IFRAME REMOTE:", iframe);
});

chrome.runtime.onMessage.addListener((msg) => {
  console.log("PLAYER GOT:", msg);

  if (msg.type === "PLAY_VIDEO") {
    if (!iframe) return;

    const videoId = msg.videoId;

    iframe.src =
      `https://www.youtube.com/embed/${videoId}` +
      `?enablejsapi=1&mute=1&origin=${encodeURIComponent(ORIGIN)}`;

    setTimeout(() => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: []
        }),
        ORIGIN
      );

      setTimeout(() => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "unMute",
            args: []
          }),
          ORIGIN
        );
      }, 300);
    }, 300);
  }
});