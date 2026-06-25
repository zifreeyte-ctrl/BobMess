import { Router } from "./Router.js";
import { Storage } from "./Storage.js";
import { EventBus } from "./EventBus.js";
import { createDefaultDatabase } from "./BackendSchema.js";
import { ApiClient } from "./ApiClient.js";
import { DataMode } from "./DataMode.js";

import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { FriendService } from "../services/FriendService.js";
import { DirectMessageService } from "../services/DirectMessageService.js";
import { ServerService } from "../services/ServerService.js";
import { ChatService } from "../services/ChatService.js";
import { InviteLinkService } from "../services/InviteLinkService.js";
import { ThemeService } from "../services/ThemeService.js";

import { AuthView } from "../components/AuthView.js";
import { ChatView } from "../components/ChatView.js";
import { ErrorView } from "../components/ErrorView.js";
import { NotificationService } from "../services/NotificationService.js";
import { SearchService } from "../services/SearchService.js";
import { RoleService } from "../services/RoleService.js";

export class App {
  constructor(rootSelector) {
    this.root = document.querySelector(rootSelector);

    this.storage = new Storage("bob_database");
    this.eventBus = new EventBus();

    this.dataMode = new DataMode({ storage: this.storage });
    this.apiClient = new ApiClient({
      baseUrl: this.dataMode.getApiBaseUrl(),
      getToken: () => this.dataMode.getToken(),
      onUnauthorized: () => {
        this.dataMode.clearToken();
      }
    });

    this.authService = new AuthService(this.storage, {
      dataMode: this.dataMode,
      apiClient: this.apiClient
    });
    this.userService = new UserService(this.storage, {
      dataMode: this.dataMode,
      apiClient: this.apiClient
    });
    this.friendService = new FriendService(this.storage);
    this.directMessageService = new DirectMessageService(this.storage, this.friendService);
    this.notificationService = new NotificationService(this.storage);
    this.roleService = new RoleService(this.storage);
    this.inviteLinkService = new InviteLinkService();
    this.searchService = new SearchService(this.storage);
    this.serverService = new ServerService(this.storage);
    this.chatService = new ChatService(this.storage);
    this.themeService = new ThemeService(this.storage);

    this.router = new Router(this.root);

    this.authView = new AuthView({
      authService: this.authService,
      dataMode: this.dataMode,
      apiClient: this.apiClient,
      eventBus: this.eventBus
    });

    this.chatView = new ChatView({
      storage: this.storage,
      authService: this.authService,
      userService: this.userService,
      friendService: this.friendService,
      directMessageService: this.directMessageService,
      notificationService: this.notificationService,
      roleService: this.roleService,
      inviteLinkService: this.inviteLinkService,
      searchService: this.searchService,
      serverService: this.serverService,
      chatService: this.chatService,
      themeService: this.themeService,
      dataMode: this.dataMode,
      apiClient: this.apiClient,
      eventBus: this.eventBus
    });
  }

  async start() {
  try {
    this.storage.initialize(createDefaultDatabase());

    this.runMigrations();
    this.roleService.migrateServers();
    this.themeService.applySavedTheme();
    this.dataMode.syncStorageMeta();
    this.apiClient.setBaseUrl(this.dataMode.getApiBaseUrl());
    this.registerEvents();

    const canOpenChat = await this.canOpenInitialChat();

    if (canOpenChat) {
      this.showChat();
    } else {
      this.showAuth();
    }
  } catch (error) {
    console.error("BobMess start error:", error);
    this.showError(error);
  }
}

async canOpenInitialChat() {
  if (!this.dataMode.isBackendMode()) {
    return this.authService.isAuthenticated();
  }

  if (!this.dataMode.getToken()) {
    this.authService.clearCurrentSession("missing_backend_token");
    return false;
  }

  this.apiClient.setBaseUrl(this.dataMode.getApiBaseUrl());

  return this.authService.restoreBackendSession();
} 

  runMigrations() {
  this.storage.update((database) => {
    if (!Array.isArray(database.users)) {
      database.users = [];
    }
        if (!database.meta) {
      database.meta = {};
    }

    database.meta.appName = "BobMess";
    database.meta.schemaVersion = 2;
    database.meta.storageMode =
      this.dataMode?.getMode?.() ||
      database.meta.storageMode ||
      "localStorage";
    database.meta.apiBaseUrl =
      this.dataMode?.getApiBaseUrl?.() ||
      database.meta.apiBaseUrl ||
      "http://localhost:4000/api";
    database.meta.backendReady = true;
    database.meta.updatedAt = new Date().toISOString();

    if (!Array.isArray(database.blockedUsers)) {
      database.blockedUsers = [];
    }

    if (!Array.isArray(database.notifications)) {
      database.notifications = [];
    }

    if (!Array.isArray(database.servers)) {
      database.servers = [];
    }

    if (!Array.isArray(database.messages)) {
      database.messages = [];
    }

    if (!Array.isArray(database.directMessages)) {
      database.directMessages = [];
    }

    if (!Array.isArray(database.friendships)) {
      database.friendships = [];
    }

    if (!Array.isArray(database.friendRequests)) {
      database.friendRequests = [];
    }

    if (!Array.isArray(database.notifications)) {
      database.notifications = [];
    }

    if (!Array.isArray(database.blockedUsers)) {
      database.blockedUsers = [];
    }

    if (!database.readState) {
      database.readState = {
        channels: {},
        dialogs: {}
      };
    }

    if (!database.readState.channels) {
      database.readState.channels = {};
    }

    if (!database.readState.dialogs) {
      database.readState.dialogs = {};
    }

    if (!database.settings) {
      database.settings = {
        theme: "dark"
      };
    }

    if (!database.settings.theme) {
      database.settings.theme = "dark";
    }

    if (!["dark", "light"].includes(database.settings.theme)) {
      database.settings.theme = "dark";
    }

    database.users.forEach((user) => {
      if (!user.id) {
        user.id = `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      }

      if (!user.username) {
        user.username = "Unknown";
      }

      if (!user.avatar) {
        user.avatar = user.username[0]?.toUpperCase() || "?";
      }

      if (!user.status) {
        user.status = "online";
      }

      if (!user.bio) {
        user.bio = "";
      }

      if (!user.createdAt) {
        user.createdAt = new Date().toISOString();
      }
    });

    database.servers.forEach((server) => {
      if (!server.id) {
        server.id = `server_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      }

      if (!server.name) {
        server.name = "Unnamed Server";
      }

      if (!server.icon) {
        server.icon = server.name[0]?.toUpperCase() || "S";
      }

      if (!server.ownerId) {
        server.ownerId = database.currentUserId || database.users[0]?.id || null;
      }

      if (!Array.isArray(server.members)) {
        server.members = [];
      }

      if (server.ownerId && !server.members.includes(server.ownerId)) {
        server.members.push(server.ownerId);
      }

      if (!Array.isArray(server.channels)) {
        server.channels = [];
      }

      if (!Array.isArray(server.roles)) {
        server.roles = [];
      }

      if (!server.memberRoles) {
        server.memberRoles = {};
      }

      if (!Array.isArray(server.invites)) {
        server.invites = [];
      }

      server.channels.forEach((channel) => {
        if (!channel.id) {
          channel.id = `channel_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        }

        if (!channel.serverId) {
          channel.serverId = server.id;
        }

        if (!channel.name) {
          channel.name = "general";
        }

        if (!channel.type) {
          channel.type = "text";
        }

        if (!channel.ownerId) {
          channel.ownerId = server.ownerId;
        }

        if (typeof channel.isPrivate !== "boolean") {
          channel.isPrivate = false;
        }

        if (!Array.isArray(channel.allowedMembers)) {
          channel.allowedMembers = [];
        }

        if (!Array.isArray(channel.allowedRoles)) {
          channel.allowedRoles = [];
        }

        if (!channel.createdAt) {
          channel.createdAt = new Date().toISOString();
        }
      });

      if (server.channels.length === 0) {
        server.channels.push({
          id: `channel_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          serverId: server.id,
          name: "general",
          type: "text",
          ownerId: server.ownerId,
          isPrivate: false,
          allowedMembers: [],
          allowedRoles: [],
          createdAt: new Date().toISOString()
        });
      }
    });

    database.messages = database.messages.filter((message) => {
      return message && message.id && message.channelId && message.authorId;
    });

    database.messages.forEach((message) => {
      if (!message.reactions) {
        message.reactions = {};
      }
    });

    database.directMessages = database.directMessages.filter((message) => {
      return (
        message &&
        message.id &&
        Array.isArray(message.userIds) &&
        message.authorId
      );
    });

    database.messages.forEach((message) => {
  if (!("attachment" in message)) {
  message.attachment = null;
  }

  if (typeof message.isPinned !== "boolean") {
    message.isPinned = false;
  }

  if (!message.pinnedBy) {
    message.pinnedBy = null;
  }

  if (!message.pinnedAt) {
    message.pinnedAt = null;
  }
});

database.directMessages.forEach((message) => {
  if (!message.reactions) {
    message.reactions = {};
  }

  if (!("attachment" in message)) {
    message.attachment = null;
  }

  if (typeof message.isPinned !== "boolean") {
    message.isPinned = false;
  }

  if (!message.pinnedBy) {
    message.pinnedBy = null;
  }

  if (!message.pinnedAt) {
    message.pinnedAt = null;
  }
});

    database.friendships = database.friendships.filter((friendship) => {
      return (
        friendship &&
        friendship.id &&
        Array.isArray(friendship.userIds) &&
        friendship.userIds.length === 2
      );
    });

database.friendRequests = database.friendRequests.filter((request) => {
  return (
    request &&
    request.id &&
    request.fromUserId &&
    request.toUserId &&
    request.status
  );
});

database.friendRequests.forEach((request) => {
  if (!request.createdAt) {
    request.createdAt = new Date().toISOString();
  }

  if (!("answeredAt" in request)) {
    request.answeredAt = null;
  }

  if (!request.status) {
    request.status = "pending";
  }
});

database.blockedUsers = database.blockedUsers.filter((record) => {
  return (
    record &&
    record.id &&
    record.blockerId &&
    record.blockedUserId &&
    record.blockerId !== record.blockedUserId
  );
});

database.blockedUsers.forEach((record) => {
  if (!record.createdAt) {
    record.createdAt = new Date().toISOString();
  }
});

database.notifications = database.notifications.filter((notification) => {
  return (
    notification &&
    notification.id &&
    notification.userId &&
    notification.type
  );
});

database.notifications.forEach((notification) => {
  if (!notification.createdAt) {
    notification.createdAt = new Date().toISOString();
  }

  if (!("readAt" in notification)) {
    notification.readAt = null;
  }

  if (!("sourceUserId" in notification)) {
    notification.sourceUserId = null;
  }

  if (!("serverId" in notification)) {
    notification.serverId = null;
  }

  if (!("channelId" in notification)) {
    notification.channelId = null;
  }

  if (!("entityId" in notification)) {
    notification.entityId = null;
  }
}); 

});
}

  registerEvents() {
    this.eventBus.on("auth:login", () => {
      this.showChat();
    });

    this.eventBus.on("auth:logout", () => {
      this.showAuth();
    });
  }

  showAuth() {
  this.router.render(this.authView);
}

  showError(error) {
  const errorView = new ErrorView({
    error,
    onReload: () => {
      window.location.reload();
    },
    onReset: () => {
      const confirmed = confirm(
        "Точно сбросить все данные BobMess в этом браузере?"
      );

      if (!confirmed) {
        return;
      }

      this.storage.clear();
      window.location.reload();
    }
  });

  this.router.render(errorView);
}
  showChat() {
    this.serverService.createDefaultDataIfNeeded();
    this.router.render(this.chatView);
  }
}