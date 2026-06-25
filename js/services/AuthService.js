import { User } from "../models/User.js";
import { DATA_MODES } from "../core/DataMode.js";
import { generateId, getCurrentDate } from "../utils/helpers.js";

export class AuthService {
  constructor(storage, { dataMode = null, apiClient = null } = {}) {
    this.storage = storage;
    this.dataMode = dataMode;
    this.apiClient = apiClient;
  }

  isBackendMode() {
    return Boolean(this.dataMode?.isBackendMode?.() && this.apiClient);
  }

  getCurrentModeLabel() {
    return this.isBackendMode() ? "Backend" : "LocalStorage";
  }

  async register(username, password) {
    if (this.isBackendMode()) {
      return this.registerWithBackend(username, password);
    }

    return this.registerLocally(username, password);
  }

  async login(username, password) {
    if (this.isBackendMode()) {
      return this.loginWithBackend(username, password);
    }

    return this.loginLocally(username, password);
  }

  registerLocally(username, password) {
    const users = this.storage.get("users");
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = users.find(
      (user) => user.username.toLowerCase() === normalizedUsername
    );

    if (existingUser) {
      throw new Error("Пользователь с таким именем уже существует.");
    }

    if (username.trim().length < 3) {
      throw new Error("Имя пользователя должно быть минимум 3 символа.");
    }

    if (password.length < 4) {
      throw new Error("Пароль должен быть минимум 4 символа.");
    }

    const user = new User({
      id: generateId("user"),
      username: username.trim(),
      password,
      avatar: username.trim()[0].toUpperCase(),
      status: "online",
      bio: "",
      createdAt: getCurrentDate()
    });

    this.storage.update((database) => {
      database.users.push(user);
      database.currentUserId = user.id;
    });

    return user;
  }

  loginLocally(username, password) {
    const users = this.storage.get("users");

    const user = users.find(
      (item) =>
        item.username.toLowerCase() === username.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      throw new Error("Неверный логин или пароль.");
    }

    this.storage.update((database) => {
      database.currentUserId = user.id;
    });

    return user;
  }

  async registerWithBackend(username, password) {
    const response = await this.apiClient.register({
      username: username.trim(),
      password
    });

    this.saveBackendSession(response);

    return response.user;
  }

  async loginWithBackend(username, password) {
    const response = await this.apiClient.login({
      username: username.trim(),
      password
    });

    this.saveBackendSession(response);

    return response.user;
  }

  async restoreBackendSession() {
    if (!this.isBackendMode()) {
      return this.isAuthenticated();
    }

    const token = this.dataMode.getToken();

    if (!token) {
      this.clearCurrentSession("missing_backend_token");
      return false;
    }

    try {
      const response = await this.apiClient.checkToken();

      if (!response?.valid || !response?.user) {
        throw new Error("Backend не подтвердил текущую сессию.");
      }

      this.upsertLocalUserFromBackend(response.user);
      this.markBackendSessionCheck(null);

      return true;
    } catch (error) {
      if (error.status === 401) {
        this.dataMode.clearToken();
        this.clearCurrentSession("invalid_backend_token", error.message);
        return false;
      }

      this.markBackendSessionCheck(error.message || "Backend недоступен.");
      return false;
    }
  }

  saveBackendSession(response) {
    if (!response?.user || !response?.token) {
      throw new Error("Backend вернул некорректный ответ авторизации.");
    }

    this.dataMode.setToken(response.token);
    this.upsertLocalUserFromBackend(response.user);
  }

  upsertLocalUserFromBackend(backendUser) {
    const normalizedUser = this.normalizeBackendUser(backendUser);

    this.storage.update((database) => {
      const existingIndex = database.users.findIndex((user) => user.id === normalizedUser.id);

      if (existingIndex >= 0) {
        database.users[existingIndex] = {
          ...database.users[existingIndex],
          ...normalizedUser,
          password: database.users[existingIndex].password || ""
        };
      } else {
        database.users.push(normalizedUser);
      }

      database.currentUserId = normalizedUser.id;

      if (!database.meta) {
        database.meta = {};
      }

      database.meta.storageMode = DATA_MODES.BACKEND;
      database.meta.lastBackendAuthAt = new Date().toISOString();
      database.meta.updatedAt = new Date().toISOString();
    });
  }

  normalizeBackendUser(user) {
    const username = String(user.username || "Unknown").trim() || "Unknown";

    return new User({
      id: user.id,
      username,
      password: "",
      avatar: user.avatar || username[0]?.toUpperCase() || "?",
      status: user.status || "online",
      bio: user.bio || "",
      createdAt: user.createdAt || user.created_at || getCurrentDate()
    });
  }

  markBackendSessionCheck(errorMessage = null) {
    this.storage.update((database) => {
      if (!database.meta) {
        database.meta = {};
      }

      database.meta.lastBackendSessionCheckAt = new Date().toISOString();
      database.meta.lastBackendSessionError = errorMessage;
      database.meta.updatedAt = new Date().toISOString();
    });
  }

  clearCurrentSession(reason = "logout", details = "") {
    this.storage.update((database) => {
      database.currentUserId = null;

      if (!database.meta) {
        database.meta = {};
      }

      database.meta.lastLogoutReason = reason;
      database.meta.lastBackendSessionError = details || null;
      database.meta.updatedAt = new Date().toISOString();
    });
  }

  logout() {
    if (this.dataMode) {
      this.dataMode.clearToken();
    }

    this.clearCurrentSession("logout");
  }

  isAuthenticated() {
    const currentUserId = this.storage.get("currentUserId");

    if (!currentUserId) {
      return false;
    }

    if (this.isBackendMode()) {
      return Boolean(this.dataMode.getToken());
    }

    return true;
  }

  getCurrentUser() {
    const users = this.storage.get("users");
    const currentUserId = this.storage.get("currentUserId");

    const user = users.find((item) => item.id === currentUserId) || null;

    if (!user) {
      return null;
    }

    if (!user.status) {
      user.status = "online";
    }

    if (!user.bio) {
      user.bio = "";
    }

    return user;
  }

  getUserById(userId) {
    const users = this.storage.get("users");

    const user = users.find((item) => item.id === userId) || null;

    if (!user) {
      return null;
    }

    if (!user.status) {
      user.status = "online";
    }

    if (!user.bio) {
      user.bio = "";
    }

    return user;
  }
}