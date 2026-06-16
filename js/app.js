import { App } from "./core/App.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        registration.update();
        console.log("BobMess service worker registered.");
      })
      .catch((error) => {
        console.warn("BobMess service worker registration failed:", error);
      });
  });
}

window.addEventListener("error", (event) => {
  console.error("Global BobMess error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled BobMess promise rejection:", event.reason);
});

document.addEventListener("DOMContentLoaded", () => {
  const app = new App("#app");

  app.start();
  registerServiceWorker();
});