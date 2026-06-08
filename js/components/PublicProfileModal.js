import { Modal } from "./Modal.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class PublicProfileModal {
  constructor({ user }) {
    this.user = user;
  }

  open() {
    const createdAt = this.user.createdAt
      ? new Date(this.user.createdAt).toLocaleDateString("ru-RU")
      : "Неизвестно";

    const modal = new Modal({
      title: "Профиль пользователя",
      confirmText: "Закрыть",
      content: `
        <div class="public-profile">
          <div class="public-profile-header">
            <div class="public-profile-avatar">
              ${renderAvatar(this.user.avatar, "?")}
            </div>

            <div>
              <h3>${escapeHTML(this.user.username)}</h3>
              <p>${escapeHTML(this.user.status || "online")}</p>
            </div>
          </div>

          <div class="public-profile-info">
            <div class="profile-info-row">
              <span>Имя пользователя</span>
              <strong>${escapeHTML(this.user.username)}</strong>
            </div>

            <div class="profile-info-row">
              <span>Статус</span>
              <strong>${escapeHTML(this.user.status || "online")}</strong>
            </div>

            <div class="profile-info-row">
              <span>Дата регистрации</span>
              <strong>${escapeHTML(createdAt)}</strong>
            </div>

            <div class="profile-info-row">
              <span>User ID</span>
              <strong>${escapeHTML(this.user.id)}</strong>
            </div>
          </div>
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();
  }
}