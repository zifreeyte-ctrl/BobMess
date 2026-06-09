import { Modal } from "./Modal.js";
import { escapeHTML, formatTime, renderAvatar } from "../utils/helpers.js";

export class PinnedMessagesModal {
  constructor({
    title = "Закреплённые сообщения",
    messages,
    userService,
    onOpenUserProfile,
    onJumpToMessage
  }) {
    this.title = title;
    this.messages = messages || [];
    this.userService = userService;
    this.onOpenUserProfile = onOpenUserProfile;
    this.onJumpToMessage = onJumpToMessage;
  }

  open() {
    const modal = new Modal({
      title: this.title,
      confirmText: "Закрыть",
      content: `
        <div class="pinned-messages-panel">
          ${this.renderMessages()}
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();

    modal.element.querySelectorAll("[data-open-user-profile]").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.dataset.openUserProfile;

        if (this.onOpenUserProfile && userId) {
          this.onOpenUserProfile(userId);
        }
      });
    });

    modal.element.querySelectorAll("[data-jump-message]").forEach((button) => {
      button.addEventListener("click", () => {
        const messageId = button.dataset.jumpMessage;

        modal.close();

        if (this.onJumpToMessage) {
          this.onJumpToMessage(messageId);
        }
      });
    });
  }

  renderMessages() {
    if (this.messages.length === 0) {
      return `
        <div class="empty-pins">
          <div>📌</div>
          <h3>Закрепов пока нет</h3>
          <p>Закрепи важное сообщение через правую кнопку мыши.</p>
        </div>
      `;
    }

    return this.messages
      .map((message) => {
        const author = this.userService.getUserById(message.authorId);

        return `
          <article class="pinned-message-card">
            <button 
              class="pinned-message-avatar"
              data-open-user-profile="${author?.id || ""}"
            >
              ${renderAvatar(author?.avatar, "?")}
            </button>

            <div class="pinned-message-content">
              <div class="pinned-message-meta">
                <button data-open-user-profile="${author?.id || ""}">
                  ${escapeHTML(author?.username || "Unknown")}
                </button>

                <span>${formatTime(message.createdAt)}</span>
              </div>

              <p>${escapeHTML(message.text)}</p>

              <button class="jump-message-button" data-jump-message="${message.id}">
                Перейти к сообщению
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }
}