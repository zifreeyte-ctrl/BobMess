import {
  BOB_COLLECTIONS,
  BOB_BACKEND_MAP,
  createBackendSnapshot,
  normalizeDatabase
} from "./BackendSchema.js";

export class Storage {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  initialize(defaultData) {
  const existingData = localStorage.getItem(this.storageKey);

  if (!existingData) {
    this.save(defaultData);
    return;
  }

  try {
    const database = JSON.parse(existingData);

    if (!database || typeof database !== "object") {
      throw new Error("Database is not an object.");
    }

    this.save({
      ...defaultData,
      ...database,
      readState: {
        ...defaultData.readState,
        ...(database.readState || {})
      },
      settings: {
        ...defaultData.settings,
        ...(database.settings || {})
      }
    });
  } catch (error) {
    console.warn("BOB database is corrupted. Backup created.");

    localStorage.setItem(
      `${this.storageKey}_broken_backup_${Date.now()}`,
      existingData
    );

    this.save(defaultData);
  }
}

  getDatabase() {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return null;
    }

    try {
      return normalizeDatabase(JSON.parse(data));
    } catch (error) {
      console.error("Cannot parse BOB database:", error);
      return null;
    }
  }

  save(database) {
    const normalizedDatabase = normalizeDatabase(database);

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(normalizedDatabase)
    );
  }

  get(collectionName) {
    const database = this.getDatabase();

    if (!database) {
      return null;
    }

    return database[collectionName];
  }

  set(collectionName, value) {
    const database = this.getDatabase();

    if (!database) {
      return;
    }

    database[collectionName] = value;

    this.save(database);
  }

  update(callback) {
    const database = this.getDatabase();

    if (!database) {
      return;
    }

    callback(database);

    this.save(database);
  }

  getCollectionNames() {
    return [...BOB_COLLECTIONS];
  }

  getBackendMap() {
    return BOB_BACKEND_MAP;
  }

  getBackendPlan() {
    return {
      appName: "BobMess",
      currentStorage: "localStorage",
      futureStorage: "REST API / Firebase / Supabase",
      idea: "Сервисы проекта уже работают через единый storage-шлюз. Чтобы подключить backend, нужно заменить Storage на API-адаптер с теми же методами: get, set, update, save, import, export.",
      collections: BOB_BACKEND_MAP,
      replaceableServices: [
        "AuthService",
        "UserService",
        "ServerService",
        "ChatService",
        "DirectMessageService",
        "FriendService",
        "NotificationService",
        "SearchService",
        "RoleService"
      ],
      requiredBackendEndpoints: Object.values(BOB_BACKEND_MAP).map((item) => {
        return item.endpoint;
      })
    };
  }

  exportSnapshot() {
    return createBackendSnapshot(this.getDatabase());
  }

  export() {
    return JSON.stringify(this.exportSnapshot(), null, 2);
  }

  import(json) {
    const parsedData = JSON.parse(json);

    const database = parsedData.collections
      ? {
          ...parsedData.collections,
          currentUserId: parsedData.state?.currentUserId || null,
          readState: parsedData.state?.readState || {
            channels: {},
            dialogs: {}
          },
          settings: parsedData.state?.settings || {
            theme: "dark"
          }
        }
      : parsedData;

    this.save(database);
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}