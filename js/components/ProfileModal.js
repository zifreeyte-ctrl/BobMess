import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";
import { escapeHTML, renderAvatar, readFileAsDataUrl } from "../utils/helpers.js";

export class ProfileModal {
  constructor({
    user,
    userService,
    friendService,
    themeService,
    onUpdate,
    onOpenDevTools,
    onLogout,
    onClearData
  }) {
    this.user = user;
    this.userService = userService;
    this.friendService = friendService;
    this.themeService = themeService;

    this.onUpdate = onUpdate;
    this.onOpenDevTools = onOpenDevTools;
    this.onLogout = onLogout;
    this.onClearData = onClearData;
  }

  getCurrentTheme() {
    if (!this.themeService) {
      return document.body.dataset.theme || "dark";
    }

    return this.themeService.getTheme();
  }

  renderThemeSection() {
    const currentTheme = this.getCurrentTheme();

    return `
      <div class="settings-section">
        <div class="settings-section-header">
          <div>
            <h3>Тема приложения</h3>
            <p>Выбери внешний вид BobMess.</p>
          </div>
        </div>

        <div class="settings-theme-grid">
          <button
            class="settings-theme-card ${currentTheme === "dark" ? "active" : ""}"
            type="button"
            data-settings-theme="dark"
          >
            <span class="theme-preview dark-preview"></span>
            <strong>Тёмная</strong>
            <small>Основная бирюзовая тема</small>
          </button>

          <button
            class="settings-theme-card ${currentTheme === "light" ? "active" : ""}"
            type="button"
            data-settings-theme="light"
          >
            <span class="theme-preview light-preview"></span>
            <strong>Светлая</strong>
            <small>Светлый аккуратный интерфейс</small>
          </button>
        </div>
      </div>
    `;
  }

  renderBlockedUsers() {
    if (!this.friendService) {
      return "";
    }

    const blockedUsers = this.friendService.getBlockedUsersForUser(this.user.id);

    if (blockedUsers.length === 0) {
      return `
        <div class="blocked-empty-state">
          Заблокированных пользователей нет.
        </div>
      `;
    }

    return blockedUsers
      .map((blockedUser) => {
        return `
          <div class="blocked-user-card">
            <div class="blocked-user-avatar">
              ${renderAvatar(blockedUser.avatar, "?")}
            </div>

            <div class="blocked-user-info">
              <strong>${escapeHTML(blockedUser.username)}</strong>
              <span>${escapeHTML(blockedUser.status || "offline")}</span>
            </div>

            <button
              class="settings-action unblock-action"
              type="button"
              data-unblock-user="${blockedUser.id}"
            >
              Разблокировать
            </button>
          </div>
        `;
      })
      .join("");
  }

  open() {
    let selectedAvatarImage = this.user.avatar?.startsWith("data:image/")
      ? this.user.avatar
      : null;

    const modal = new Modal({
      title: "Настройки приложения",
      confirmText: "Сохранить профиль",
      content: `
        <div class="settings-modal">
          <div class="settings-profile-card">
            <div class="profile-preview">
              <div class="profile-avatar-preview" id="avatarPreview">
                ${renderAvatar(this.user.avatar, "?")}
              </div>

              <div class="settings-profile-main">
                <h3 id="usernamePreview">${escapeHTML(this.user.username)}</h3>
                <p id="statusPreview">${escapeHTML(this.user.status || "online")}</p>
                <span id="bioPreview">${escapeHTML(this.user.bio || "Описание профиля не указано.")}</span>
              </div>
            </div>
          </div>

          ${this.renderThemeSection()}

          <div class="settings-section">
            <div class="settings-section-header">
              <div>
                <h3>Профиль</h3>
                <p>Настрой имя, статус, описание и аватар.</p>
              </div>
            </div>

            <div class="settings-form-grid">
              <div class="form-group">
                <label>Имя пользователя</label>
                <input
                  id="profileUsernameInput"
                  type="text"
                  value="${escapeHTML(this.user.username)}"
                />
              </div>

              <div class="form-group">
                <label>Аватар буквами</label>
                <input
                  id="profileAvatarInput"
                  type="text"
                  maxlength="2"
                  value="${this.user.avatar?.startsWith("data:image/") ? "" : escapeHTML(this.user.avatar || "")}"
                  placeholder="A"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Фото-аватар</label>
              <input
                id="profileAvatarFileInput"
                type="file"
                accept="image/*"
              />
            </div>

            <button class="settings-action" id="resetAvatarButton" type="button">
              Сбросить фото и использовать буквы
            </button>

            <div class="form-group">
              <label>Статус</label>
              <input
                id="profileStatusInput"
                type="text"
                maxlength="32"
                placeholder="online"
                value="${escapeHTML(this.user.status || "online")}"
              />
            </div>

            <div class="form-group">
              <label>О себе</label>
              <textarea
                id="profileBioInput"
                maxlength="160"
                rows="3"
                placeholder="Коротко о себе..."
              >${escapeHTML(this.user.bio || "")}</textarea>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-header">
              <div>
                <h3>Заблокированные пользователи</h3>
                <p>Здесь можно разблокировать пользователей.</p>
              </div>
            </div>

            <div class="blocked-users-list" id="blockedUsersSlot">
              ${this.renderBlockedUsers()}
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-header">
              <div>
                <h3>Смена пароля</h3>
                <p>Пароль хранится локально в учебном проекте.</p>
              </div>
            </div>

            <div class="settings-form-grid">
              <div class="form-group">
                <label>Старый пароль</label>
                <input id="oldPasswordInput" type="password" />
              </div>

              <div class="form-group">
                <label>Новый пароль</label>
                <input id="newPasswordInput" type="password" />
              </div>
            </div>

            <button class="settings-action" id="changePasswordButton" type="button">
              Изменить пароль
            </button>
          </div>

          <div class="settings-section">
            <div class="settings-section-header">
              <div>
                <h3>Данные приложения</h3>
                <p>Выход, инструменты разработчика и очистка localStorage.</p>
              </div>
            </div>

            <div class="settings-actions-grid">
              <button class="settings-action" id="openDevToolsButton" type="button">
                Открыть инструменты разработчика
              </button>

              <button class="settings-action" id="logoutFromSettingsButton" type="button">
                Выйти из аккаунта
              </button>

              <button class="settings-action danger" id="clearDataButton" type="button">
                Очистить все данные BobMess
              </button>
            </div>
          </div>
        </div>
      `,
      onConfirm: (modalElement) => {
        const username = modalElement.querySelector("#profileUsernameInput").value;
        const avatarText = modalElement.querySelector("#profileAvatarInput").value;
        const status = modalElement.querySelector("#profileStatusInput").value;
        const bio = modalElement.querySelector("#profileBioInput").value;

        const avatar =
          selectedAvatarImage ||
          avatarText ||
          username.trim()[0]?.toUpperCase() ||
          "?";

        try {
          this.userService.updateProfile(this.user.id, {
            username,
            avatar,
            status,
            bio
          });

          Toast.show("Профиль обновлён.");
          modal.close();

          if (this.onUpdate) {
            this.onUpdate();
          }
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();

    const usernameInput = modal.element.querySelector("#profileUsernameInput");
    const avatarInput = modal.element.querySelector("#profileAvatarInput");
    const avatarFileInput = modal.element.querySelector("#profileAvatarFileInput");
    const statusInput = modal.element.querySelector("#profileStatusInput");
    const bioInput = modal.element.querySelector("#profileBioInput");

    const usernamePreview = modal.element.querySelector("#usernamePreview");
    const avatarPreview = modal.element.querySelector("#avatarPreview");
    const statusPreview = modal.element.querySelector("#statusPreview");
    const bioPreview = modal.element.querySelector("#bioPreview");

    const updateLetterAvatarPreview = () => {
      const letter =
        avatarInput.value.trim().toUpperCase() ||
        usernameInput.value.trim()[0]?.toUpperCase() ||
        "?";

      avatarPreview.innerHTML = escapeHTML(letter.slice(0, 2));
    };

    usernameInput.addEventListener("input", () => {
      usernamePreview.textContent = usernameInput.value || "username";

      if (!selectedAvatarImage && !avatarInput.value.trim()) {
        updateLetterAvatarPreview();
      }
    });

    avatarInput.addEventListener("input", () => {
      selectedAvatarImage = null;
      updateLetterAvatarPreview();
    });

    avatarFileInput.addEventListener("change", async () => {
      const file = avatarFileInput.files[0];

      if (!file) {
        return;
      }

      try {
        selectedAvatarImage = await readFileAsDataUrl(file);
        avatarInput.value = "";
        avatarPreview.innerHTML = `<img src="${selectedAvatarImage}" alt="" />`;
      } catch (error) {
        Toast.show(error.message, "error");
      }
    });

    modal.element.querySelector("#resetAvatarButton").addEventListener("click", () => {
      selectedAvatarImage = null;
      avatarFileInput.value = "";

      if (!avatarInput.value.trim()) {
        avatarInput.value = usernameInput.value.trim()[0]?.toUpperCase() || "?";
      }

      updateLetterAvatarPreview();
      Toast.show("Фото-аватар сброшен.");
    });

    statusInput.addEventListener("input", () => {
      statusPreview.textContent = statusInput.value || "online";
    });

    bioInput.addEventListener("input", () => {
      bioPreview.textContent =
        bioInput.value.trim() || "Описание профиля не указано.";
    });

    modal.element.querySelectorAll("[data-settings-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = button.dataset.settingsTheme;

        if (!this.themeService) {
          return;
        }

        this.themeService.setTheme(theme);

        modal.element.querySelectorAll("[data-settings-theme]").forEach((item) => {
          item.classList.toggle("active", item.dataset.settingsTheme === theme);
        });

        Toast.show(theme === "light" ? "Включена светлая тема." : "Включена тёмная тема.");

        if (this.onUpdate) {
          this.onUpdate();
        }
      });
    });

    const bindUnblockButtons = () => {
      modal.element.querySelectorAll("[data-unblock-user]").forEach((button) => {
        button.addEventListener("click", () => {
          try {
            this.friendService.unblockUser(this.user.id, button.dataset.unblockUser);

            const slot = modal.element.querySelector("#blockedUsersSlot");
            slot.innerHTML = this.renderBlockedUsers();

            Toast.show("Пользователь разблокирован.");
            bindUnblockButtons();

            if (this.onUpdate) {
              this.onUpdate();
            }
          } catch (error) {
            Toast.show(error.message, "error");
          }
        });
      });
    };

    bindUnblockButtons();

    modal.element.querySelector("#changePasswordButton").addEventListener("click", () => {
      const oldPassword = modal.element.querySelector("#oldPasswordInput").value;
      const newPassword = modal.element.querySelector("#newPasswordInput").value;

      try {
        this.userService.changePassword(this.user.id, oldPassword, newPassword);

        modal.element.querySelector("#oldPasswordInput").value = "";
        modal.element.querySelector("#newPasswordInput").value = "";

        Toast.show("Пароль изменён.");
      } catch (error) {
        Toast.show(error.message, "error");
      }
    });

    const devToolsButton = modal.element.querySelector("#openDevToolsButton");

    if (devToolsButton) {
      devToolsButton.addEventListener("click", () => {
        modal.close();

        if (this.onOpenDevTools) {
          this.onOpenDevTools();
        }
      });
    }

    modal.element.querySelector("#logoutFromSettingsButton").addEventListener("click", () => {
      modal.close();

      if (this.onLogout) {
        this.onLogout();
      }
    });

    modal.element.querySelector("#clearDataButton").addEventListener("click", () => {
      const confirmModal = new Modal({
        title: "Очистить данные",
        confirmText: "Очистить",
        content: `
          <div class="confirm-box">
            <h3>Удалить все данные BobMess?</h3>
            <p>
              Будут удалены аккаунты, серверы, сообщения, друзья, заявки,
              настройки и все данные из localStorage.
            </p>

            <div class="form-group">
              <label>Для подтверждения введи СБРОС</label>
              <input id="clearDataConfirmInput" type="text" placeholder="СБРОС" />
            </div>
          </div>
        `,
        onConfirm: (confirmElement) => {
          const value = confirmElement
            .querySelector("#clearDataConfirmInput")
            .value
            .trim()
            .toUpperCase();

          if (value !== "СБРОС") {
            Toast.show("Введи СБРОС для подтверждения.", "error");
            return;
          }

          confirmModal.close();
          modal.close();

          if (this.onClearData) {
            this.onClearData();
          }
        }
      });

      confirmModal.open();
    });
  }
} 