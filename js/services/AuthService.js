import { User } from "../models/User.js";
import { generateId, getCurrentDate } from "../utils/helpers.js";

export class AuthService {
  constructor(storage) {
    this.storage = storage;
  }

  register(username, password) {
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

  login(username, password) {
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

  logout() {
    this.storage.update((database) => {
      database.currentUserId = null;
    });
  }

  isAuthenticated() {
    return Boolean(this.storage.get("currentUserId"));
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