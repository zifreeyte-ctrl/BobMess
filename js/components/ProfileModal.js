import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";
import { escapeHTML, renderAvatar, readFileAsDataUrl } from "../utils/helpers.js";

export class ProfileModal {
  constructor({ user, userService, friendService, onUpdate, onOpenDevTools }) {
    this.user = user;
    this.onOpenDevTools = onOpenDevTools;
    this.userService = userService;
    this.friendService = friendService;
    this.onUpdate = onUpdate;
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
    const modal = new Modal({
      title: "Профиль пользователя",
      confirmText: "Сохранить",
      content: `
        <div class="profile-editor">
          <div class="profile-preview">
            <div class="profile-avatar-preview" id="avatarPreview">
              ${renderAvatar(this.user.avatar)}
            </div>

            <div>
              <h3 id="usernamePreview">${escapeHTML(this.user.username)}</h3>
              <p id="statusPreview">${escapeHTML(this.user.status || "online")}</p>
            </div>
          </div>

          <div class="form-group">
            <label>Имя пользователя</label>
            <input 
              id="profileUsernameInput" 
              type="text" 
              value="${escapeHTML(this.user.username)}" 
            />
          </div>

          <div class="form-group">
            <label>Аватар буквами, 1–2 символа</label>
            <input 
              id="profileAvatarInput" 
              type="text" 
              maxlength="2"
              value="${this.user.avatar?.startsWith("data:image/") ? "" : escapeHTML(this.user.avatar)}" 
            />
          </div>

          <div class="form-group">
            <label>Фото-аватар</label>
            <input 
              id="profileAvatarFileInput" 
              type="file" 
              accept="image/*"
            />
          </div>

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

          <div class="profile-password-box">
            <h3>Заблокированные пользователи</h3>
            <div class="blocked-users-list">
              ${this.renderBlockedUsers()}
            </div>
          </div>

          <div class="profile-password-box">
            <h3>Разработка</h3>

            <button class="settings-action" id="openDevToolsButton" type="button">
              Открыть инструменты разработчика
            </button>
          </div>

          <div class="profile-password-box">
            <h3>Смена пароля</h3>

            <div class="form-group">
              <label>Старый пароль</label>
              <input id="oldPasswordInput" type="password" />
            </div>

            <div class="form-group">
              <label>Новый пароль</label>
              <input id="newPasswordInput" type="password" />
            </div>

            <button class="settings-action" id="changePasswordButton" type="button">
              Изменить пароль
            </button>
          </div>
        </div>
      `,
      onConfirm: (modalElement) => {
        const username = modalElement.querySelector("#profileUsernameInput").value;
        const avatarText = modalElement.querySelector("#profileAvatarInput").value;
        const avatar = selectedAvatarImage || avatarText;
        const status = modalElement.querySelector("#profileStatusInput").value;

        try {
          this.userService.updateProfile(this.user.id, {
            username,
            avatar,
            status
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

    modal.element.querySelectorAll("[data-unblock-user]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          this.friendService.unblockUser(this.user.id, button.dataset.unblockUser);

          Toast.show("Пользователь разблокирован.");
          modal.close();

          if (this.onUpdate) {
            this.onUpdate();
          }
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
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

    const usernameInput = modal.element.querySelector("#profileUsernameInput");
    const avatarInput = modal.element.querySelector("#profileAvatarInput");
    const avatarFileInput = modal.element.querySelector("#profileAvatarFileInput");
    let selectedAvatarImage = this.user.avatar?.startsWith("data:image/")
      ? this.user.avatar
      : null;
    const statusInput = modal.element.querySelector("#profileStatusInput");

    const usernamePreview = modal.element.querySelector("#usernamePreview");
    const avatarPreview = modal.element.querySelector("#avatarPreview");
    const statusPreview = modal.element.querySelector("#statusPreview");

    usernameInput.addEventListener("input", () => {
      usernamePreview.textContent = usernameInput.value || "username";
    });

    avatarInput.addEventListener("input", () => {
  selectedAvatarImage = null;
  avatarPreview.innerHTML = escapeHTML(avatarInput.value.toUpperCase() || "?");
});

    avatarFileInput.addEventListener("change", async () => {
      const file = avatarFileInput.files[0];

      if (!file) {
        return;
      }

      try {
        selectedAvatarImage = await readFileAsDataUrl(file);
        avatarPreview.innerHTML = `<img src="${selectedAvatarImage}" alt="avatar" />`;
      } catch (error) {
        Toast.show(error.message, "error");
      }
    });

    statusInput.addEventListener("input", () => {
      statusPreview.textContent = statusInput.value || "online";
    });

    modal.element
      .querySelector("#changePasswordButton")
      .addEventListener("click", () => {
        const oldPassword = modal.element.querySelector("#oldPasswordInput").value;
        const newPassword = modal.element.querySelector("#newPasswordInput").value;

        try {
          this.userService.changePassword(
            this.user.id,
            oldPassword,
            newPassword
          );

          modal.element.querySelector("#oldPasswordInput").value = "";
          modal.element.querySelector("#newPasswordInput").value = "";

          Toast.show("Пароль изменён.");
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
  }
}