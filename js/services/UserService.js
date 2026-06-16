export class UserService {
  constructor(storage) {
    this.storage = storage;
  }

  getUsers() {
    return this.storage.get("users") || [];
  }

  getUserById(userId) {
    return this.getUsers().find((user) => user.id === userId) || null;
  }

  updateProfile(userId, data) {
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

    if (!avatar.startsWith("data:image/") && (avatar.length < 1 || avatar.length > 2)) {
      throw new Error("Аватар должен быть 1 или 2 символа, либо фото.");
    }

    if (status.length > 32) {
      throw new Error("Статус должен быть максимум 32 символа.");
    }

    if (bio.length > 160) {
      throw new Error("Описание профиля должно быть максимум 160 символов.");
    }

    this.storage.update((database) => {
      const user = database.users.find((item) => item.id === userId);

      if (!user) {
        throw new Error("Пользователь не найден.");
      }

      const usernameExists = database.users.some((item) => {
        return (
          item.id !== userId &&
          item.username.toLowerCase() === username.toLowerCase()
        );
      });

      if (usernameExists) {
        throw new Error("Пользователь с таким именем уже существует.");
      }

      user.username = username;
      user.avatar = avatar;
      user.status = status || "online";
      user.bio = bio;
    });
  }

  changePassword(userId, oldPassword, newPassword) {
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
    });
  }
}