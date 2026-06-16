const BOB_CACHE_VERSION = "bobmess-pwa-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/bob-icon.svg",

  "./css/auth.css",
  "./css/base.css",
  "./css/chat.css",
  "./css/layout.css",
  "./css/modal.css",
  "./css/themes.css",

  "./js/app.js",

  "./js/components/AuthView.js",
  "./js/components/ChannelList.js",
  "./js/components/ChatView.js",
  "./js/components/Component.js",
  "./js/components/ContextMenu.js",
  "./js/components/DevToolsModal.js",
  "./js/components/DirectMessageView.js",
  "./js/components/ErrorView.js",
  "./js/components/FriendList.js",
  "./js/components/ImageViewerModal.js",
  "./js/components/MessageList.js",
  "./js/components/Modal.js",
  "./js/components/PinnedMessagesModal.js",
  "./js/components/ProfileModal.js",
  "./js/components/PublicProfileModal.js",
  "./js/components/ServerAdminModal.js",
  "./js/components/ServerList.js",
  "./js/components/ServerMembersPanel.js",
  "./js/components/ServerMembersSidebar.js",
  "./js/components/Toast.js",

  "./js/core/App.js",
  "./js/core/BackendSchema.js",
  "./js/core/EventBus.js",
  "./js/core/Router.js",
  "./js/core/Storage.js",

  "./js/models/Channel.js",
  "./js/models/Message.js",
  "./js/models/Server.js",
  "./js/models/User.js",

  "./js/services/AuthService.js",
  "./js/services/ChatService.js",
  "./js/services/DirectMessageService.js",
  "./js/services/FriendService.js",
  "./js/services/InviteLinkService.js",
  "./js/services/NotificationService.js",
  "./js/services/RoleService.js",
  "./js/services/SearchService.js",
  "./js/services/ServerService.js",
  "./js/services/ThemeService.js",
  "./js/services/UserService.js",

  "./js/utils/helpers.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(BOB_CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== BOB_CACHE_VERSION)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();

          caches.open(BOB_CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});