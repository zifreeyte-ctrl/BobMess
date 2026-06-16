export const DATABASE_VERSION = 2;

export const BOB_COLLECTIONS = [
  "users",
  "servers",
  "messages",
  "directMessages",
  "friendships",
  "friendRequests",
  "blockedUsers",
  "notifications"
];

export const BOB_BACKEND_MAP = {
  users: {
    endpoint: "/api/users",
    primaryKey: "id",
    description: "Аккаунты пользователей, профиль, аватар, статус"
  },

  servers: {
    endpoint: "/api/servers",
    primaryKey: "id",
    description: "Серверы, каналы, роли, участники, invite-ссылки"
  },

  messages: {
    endpoint: "/api/messages",
    primaryKey: "id",
    description: "Сообщения в каналах"
  },

  directMessages: {
    endpoint: "/api/direct-messages",
    primaryKey: "id",
    description: "Личные сообщения"
  },

  friendships: {
    endpoint: "/api/friendships",
    primaryKey: "id",
    description: "Связи друзей"
  },

  friendRequests: {
    endpoint: "/api/friend-requests",
    primaryKey: "id",
    description: "Входящие и исходящие заявки в друзья"
  },

  blockedUsers: {
    endpoint: "/api/blocked-users",
    primaryKey: "id",
    description: "Блокировки пользователей"
  },

  notifications: {
    endpoint: "/api/notifications",
    primaryKey: "id",
    description: "Уведомления и события"
  }
};

export function createDefaultDatabase() {
  return {
    meta: {
      appName: "BobMess",
      schemaVersion: DATABASE_VERSION,
      storageMode: "localStorage",
      backendReady: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    users: [],
    currentUserId: null,

    servers: [],
    messages: [],
    directMessages: [],

    friendships: [],
    friendRequests: [],
    blockedUsers: [],

    notifications: [],

    readState: {
      channels: {},
      dialogs: {}
    },

    settings: {
      theme: "dark"
    }
  };
}

export function normalizeDatabase(database = {}) {
  const defaultDatabase = createDefaultDatabase();

  const normalizedDatabase = {
    ...defaultDatabase,
    ...database
  };

  normalizedDatabase.meta = {
    ...defaultDatabase.meta,
    ...(database.meta || {}),
    schemaVersion: DATABASE_VERSION,
    storageMode: "localStorage",
    backendReady: true,
    updatedAt: new Date().toISOString()
  };

  BOB_COLLECTIONS.forEach((collectionName) => {
    if (!Array.isArray(normalizedDatabase[collectionName])) {
      normalizedDatabase[collectionName] = [];
    }
  });

  if (!normalizedDatabase.readState) {
    normalizedDatabase.readState = {
      channels: {},
      dialogs: {}
    };
  }

  if (!normalizedDatabase.readState.channels) {
    normalizedDatabase.readState.channels = {};
  }

  if (!normalizedDatabase.readState.dialogs) {
    normalizedDatabase.readState.dialogs = {};
  }

  if (!normalizedDatabase.settings) {
    normalizedDatabase.settings = {
      theme: "dark"
    };
  }

  if (!["dark", "light"].includes(normalizedDatabase.settings.theme)) {
    normalizedDatabase.settings.theme = "dark";
  }

  return normalizedDatabase;
}

export function createBackendSnapshot(database) {
  const normalizedDatabase = normalizeDatabase(database);

  const collections = {};

  BOB_COLLECTIONS.forEach((collectionName) => {
    collections[collectionName] = normalizedDatabase[collectionName];
  });

  return {
    appName: "BobMess",
    schemaVersion: DATABASE_VERSION,
    exportedAt: new Date().toISOString(),
    storageMode: "localStorage",
    backendReady: true,
    apiMap: BOB_BACKEND_MAP,
    collections,
    state: {
      currentUserId: normalizedDatabase.currentUserId,
      readState: normalizedDatabase.readState,
      settings: normalizedDatabase.settings
    }
  };
}