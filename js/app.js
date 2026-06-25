import { App } from "./core/App.js";
import { PwaManager } from "./core/PwaManager.js";

window.addEventListener("error", (event) => {
  console.error("Global BobMess error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled BobMess promise rejection:", event.reason);
});

document.addEventListener("DOMContentLoaded", () => {
  const app = new App("#app");
  const pwaManager = new PwaManager({
    serviceWorkerPath: "./sw.js"
  });

  app.start();
  pwaManager.init();
});