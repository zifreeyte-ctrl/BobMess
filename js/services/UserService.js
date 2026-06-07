export class UserService {
  constructor(storage) {
    this.storage = storage;
  }

  getUsers() {
    return this.storage.get("users");
  }

  getUserById(userId) {
    return this.getUsers().find((user) => user.id === userId) || null;
  }

  updateProfile(userId, data) {
    const username = data.username.trim();
    const avatar = data.avatar.startsWith("data:image/")
      ? data.avatar
      : data.avatar.trim().toUpperCase();
    const status = data.status.trim();

    if (username.length < 3) {
      throw new Error("Имя пользователя должно быть минимум 3 символа.");
    }

    if (avatar.length < 1 || avatar.length > 2) {
      throw new Error("Аватар должен быть 1 или 2 символа.");
    }

    if (status.length > 32) {
      throw new Error("Статус должен быть максимум 32 символа.");
    }

    this.storage.update((database) => {
      const user = database.users.find((item) => item.id === userId);

      if (!user) {
        throw new Error("Пользователь не найден.");
      }

      const usernameExists = database.users.some(
        (item) =>
          item.id !== userId &&
          item.username.toLowerCase() === username.toLowerCase()
      );

      if (usernameExists) {
        throw new Error("Пользователь с таким именем уже существует.");
      }

      user.username = username;
      user.avatar = avatar;
      user.status = status || "online";
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