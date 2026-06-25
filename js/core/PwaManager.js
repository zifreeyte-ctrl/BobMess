export class PwaManager {
  constructor({ serviceWorkerPath = "./sw.js" } = {}) {
    this.serviceWorkerPath = serviceWorkerPath;

    this.deferredPrompt = null;
    this.registration = null;
    this.isRefreshing = false;

    this.installBanner = null;
    this.updateBanner = null;
    this.networkBadge = null;
  }

  init() {
    this.bindInstallPrompt();
    this.bindAppInstalled();
    this.bindNetworkStatus();
    this.registerServiceWorker();
  }

  bindInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();

      this.deferredPrompt = event;

      if (this.isStandaloneMode() || this.isInstallRecentlyDismissed()) {
        return;
      }

      this.showInstallBanner();
    });
  }

  bindAppInstalled() {
    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      this.hideInstallBanner();
      localStorage.setItem("bob_pwa_installed", "true");
    });
  }

  bindNetworkStatus() {
    window.addEventListener("online", () => {
      this.renderNetworkBadge();
    });

    window.addEventListener("offline", () => {
      this.renderNetworkBadge();
    });

    this.renderNetworkBadge();
  }

  async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", async () => {
      try {
        this.registration = await navigator.serviceWorker.register(
          this.serviceWorkerPath
        );

        this.registration.addEventListener("updatefound", () => {
          const newWorker = this.registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener("statechange", () => {
            const hasOldController = Boolean(navigator.serviceWorker.controller);

            if (newWorker.state === "installed" && hasOldController) {
              this.showUpdateBanner();
            }
          });
        });

        if (this.registration.waiting && navigator.serviceWorker.controller) {
          this.showUpdateBanner();
        }

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (this.isRefreshing) {
            return;
          }

          this.isRefreshing = true;
          window.location.reload();
        });

        this.registration.update();
      } catch (error) {
        console.warn("BobMess service worker registration failed:", error);
      }
    });
  }

  getShell() {
    let shell = document.querySelector(".pwa-floating-stack");

    if (!shell) {
      shell = document.createElement("div");
      shell.className = "pwa-floating-stack";
      document.body.append(shell);
    }

    return shell;
  }

  showInstallBanner() {
    if (this.installBanner || !this.deferredPrompt) {
      return;
    }

    const shell = this.getShell();

    this.installBanner = document.createElement("section");
    this.installBanner.className = "pwa-banner install-banner";
    this.installBanner.innerHTML = `
      <div class="pwa-banner-icon">📱</div>

      <div class="pwa-banner-text">
        <strong>Установить BobMess</strong>
        <span>Открой мессенджер как отдельное приложение на телефоне или ПК.</span>
      </div>

      <div class="pwa-banner-actions">
        <button class="pwa-action primary" id="installBobAppButton" type="button">
          Установить
        </button>

        <button class="pwa-action ghost" id="dismissInstallBobAppButton" type="button">
          Позже
        </button>
      </div>
    `;

    shell.append(this.installBanner);

    this.installBanner
      .querySelector("#installBobAppButton")
      .addEventListener("click", () => {
        this.installApp();
      });

    this.installBanner
      .querySelector("#dismissInstallBobAppButton")
      .addEventListener("click", () => {
        this.dismissInstallBanner();
      });
  }

  hideInstallBanner() {
    if (!this.installBanner) {
      return;
    }

    this.installBanner.remove();
    this.installBanner = null;
  }

  async installApp() {
    if (!this.deferredPrompt) {
      this.hideInstallBanner();
      return;
    }

    const promptEvent = this.deferredPrompt;

    this.deferredPrompt = null;

    promptEvent.prompt();

    try {
      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        localStorage.setItem("bob_pwa_installed", "true");
      } else {
        this.markInstallDismissed();
      }
    } catch (error) {
      console.warn("BobMess install prompt failed:", error);
    }

    this.hideInstallBanner();
  }

  dismissInstallBanner() {
    this.markInstallDismissed();
    this.hideInstallBanner();
  }

  markInstallDismissed() {
    localStorage.setItem(
      "bob_pwa_install_dismissed_at",
      String(Date.now())
    );
  }

  isInstallRecentlyDismissed() {
    const dismissedAt = Number(
      localStorage.getItem("bob_pwa_install_dismissed_at") || "0"
    );

    if (!dismissedAt) {
      return false;
    }

    const threeDays = 1000 * 60 * 60 * 24 * 3;

    return Date.now() - dismissedAt < threeDays;
  }

  isStandaloneMode() {
    const isStandaloneDisplayMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    const isIosStandalone =
      "standalone" in window.navigator && window.navigator.standalone;

    return isStandaloneDisplayMode || isIosStandalone;
  }

  showUpdateBanner() {
    if (this.updateBanner) {
      return;
    }

    const shell = this.getShell();

    this.updateBanner = document.createElement("section");
    this.updateBanner.className = "pwa-banner update-banner";
    this.updateBanner.innerHTML = `
      <div class="pwa-banner-icon">✨</div>

      <div class="pwa-banner-text">
        <strong>Доступно обновление BobMess</strong>
        <span>Новая версия уже загружена. Обнови приложение, чтобы применить изменения.</span>
      </div>

      <div class="pwa-banner-actions">
        <button class="pwa-action primary" id="updateBobAppButton" type="button">
          Обновить
        </button>

        <button class="pwa-action ghost" id="dismissUpdateBobAppButton" type="button">
          Позже
        </button>
      </div>
    `;

    shell.append(this.updateBanner);

    this.updateBanner
      .querySelector("#updateBobAppButton")
      .addEventListener("click", () => {
        this.applyUpdate();
      });

    this.updateBanner
      .querySelector("#dismissUpdateBobAppButton")
      .addEventListener("click", () => {
        this.hideUpdateBanner();
      });
  }

  hideUpdateBanner() {
    if (!this.updateBanner) {
      return;
    }

    this.updateBanner.remove();
    this.updateBanner = null;
  }

  applyUpdate() {
    if (!this.registration?.waiting) {
      window.location.reload();
      return;
    }

    this.registration.waiting.postMessage({
      type: "SKIP_WAITING"
    });
  }

  renderNetworkBadge() {
    const isOnline = navigator.onLine;

    if (isOnline) {
      this.hideNetworkBadge();
      return;
    }

    if (this.networkBadge) {
      return;
    }

    const shell = this.getShell();

    this.networkBadge = document.createElement("div");
    this.networkBadge.className = "pwa-network-badge";
    this.networkBadge.innerHTML = `
      <span>●</span>
      Нет интернета. BobMess открыт из кэша.
    `;

    shell.append(this.networkBadge);
  }

  hideNetworkBadge() {
    if (!this.networkBadge) {
      return;
    }

    this.networkBadge.remove();
    this.networkBadge = null;
  }
}