import { User } from "../models/User.js";
import { getCurrentDate } from "../utils/helpers.js";

export class UserService {
  constructor(storage, { dataMode = null, apiClient = null } = {}) {
    this.storage = storage;
    this.dataMode = dataMode;
    this.apiClient = apiClient;
  }

  isBackendMode() {
    return Boolean(this.dataMode?.isBackendMode?.() && this.apiClient);
  }

  getUsers() {
    return this.storage.get("users") || [];
  }

  getUserById(userId) {
    return this.getUsers().find((user) => user.id === userId) || null;
  }

  normalizeProfileData(data) {
    const username = String(data.username || "").trim();
    const rawAvatar = String(data.avatar || "").trim();
    const status = String(data.status || "").trim();
    const bio = String(data.bio || "").trim();

    const avatar = rawAvatar.startsWith("data:image/")
      ? rawAvatar
      : (rawAvatar || username[0] || "?").toUpperCase().slice(0, 2);

    if (username.length < 3) {
      throw new Error("Имя пользователя должно быть минимум 3 символа.");
    }

    if (username.length > 32) {
      throw new Error("Имя пользователя должно быть максимум 32 символа.");
    }

    if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) {
      throw new Error("В имени можно использовать буквы, цифры, точку, нижнее подчёркивание и дефис.");
    }

    if (!avatar.startsWith("data:image/") && (avatar.length < 1 || avatar.length > 2)) {
      throw new Error("Аватар должен быть 1 или 2 символа, либо фото.");
    }

    if (avatar.startsWith("data:image/") && avatar.length > 700000) {
      throw new Error("Фото-аватар слишком большой. На backend MVP максимум 700 KB.");
    }

    if (status.length > 32) {
      throw new Error("Статус должен быть максимум 32 символа.");
    }

    if (bio.length > 160) {
      throw new Error("Описание профиля должно быть максимум 160 символов.");
    }

    return {
      username,
      avatar,
      status: status || "online",
      bio
    };
  }

  async updateProfile(userId, data) {
    const normalizedData = this.normalizeProfileData(data);

    if (this.isBackendMode()) {
      const currentUserId = this.storage.get("currentUserId");

      if (userId !== currentUserId) {
        throw new Error("Через backend сейчас можно обновлять только свой профиль.");
      }

      const response = await this.apiClient.updateMe(normalizedData);

      if (!response?.user) {
        throw new Error("Backend вернул некорректный ответ профиля.");
      }

      this.upsertBackendUser(response.user);
      return response.user;
    }

    this.updateLocalProfile(userId, normalizedData);
    return this.getUserById(userId);
  }

  updateLocalProfile(userId, data) {
    this.storage.update((database) => {
      const user = database.users.find((item) => item.id === userId);

      if (!user) {
        throw new Error("Пользователь не найден.");
      }

      const usernameExists = database.users.some((item) => {
        return (
          item.id !== userId &&
          item.username.toLowerCase() === data.username.toLowerCase()
        );
      });

      if (usernameExists) {
        throw new Error("Пользователь с таким именем уже существует.");
      }

      user.username = data.username;
      user.avatar = data.avatar;
      user.status = data.status;
      user.bio = data.bio;
      user.updatedAt = new Date().toISOString();
    });
  }

  upsertBackendUser(backendUser) {
    const username = String(backendUser.username || "Unknown").trim() || "Unknown";

    const normalizedUser = new User({
      id: backendUser.id,
      username,
      password: "",
      avatar: backendUser.avatar || username[0]?.toUpperCase() || "?",
      status: backendUser.status || "online",
      bio: backendUser.bio || "",
      createdAt: backendUser.createdAt || backendUser.created_at || getCurrentDate()
    });

    this.storage.update((database) => {
      const existingIndex = database.users.findIndex((user) => user.id === normalizedUser.id);

      if (existingIndex >= 0) {
        database.users[existingIndex] = {
          ...database.users[existingIndex],
          ...normalizedUser,
          password: database.users[existingIndex].password || "",
          updatedAt: backendUser.updatedAt || backendUser.updated_at || new Date().toISOString()
        };
      } else {
        database.users.push({
          ...normalizedUser,
          updatedAt: backendUser.updatedAt || backendUser.updated_at || new Date().toISOString()
        });
      }

      database.currentUserId = normalizedUser.id;

      if (!database.meta) {
        database.meta = {};
      }

      database.meta.lastBackendProfileSyncAt = new Date().toISOString();
      database.meta.updatedAt = new Date().toISOString();
    });
  }

  changePassword(userId, oldPassword, newPassword) {
    if (this.isBackendMode()) {
      throw new Error("Смена пароля через backend будет добавлена отдельным безопасным endpoint.");
    }

    if (newPassword.length < 4) {
      throw new Error("Новый пароль должен быть минимум 4 символа.");
    }

    this.storage.update((database) => {
      const user = database.users.find((item) => item.id === userId);

      if (!user) {
        throw new Error("Пользователь не найден.");
      }

      if (user.password !== oldPassword) {
        throw new Error("Старый пароль указан неверно.");
      }

      user.password = newPassword;
      user.updatedAt = new Date().toISOString();
    });
  }
}