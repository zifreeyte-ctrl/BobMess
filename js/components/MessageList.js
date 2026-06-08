import { Component } from "./Component.js";
import { ContextMenu } from "./ContextMenu.js";
import { formatTime, escapeHTML, renderAvatar } from "../utils/helpers.js";

export class MessageList extends Component {
  constructor({
    messages,
    searchResults = null,
    authService,
    currentUser,
    onDeleteMessage,
    onEditMessage,
    onOpenUserProfile
  }) {
    super();

    this.messages = messages;
    this.searchResults = searchResults;
    this.authService = authService;
    this.currentUser = currentUser;
    this.onDeleteMessage = onDeleteMessage;
    this.onEditMessage = onEditMessage;
    this.onOpenUserProfile = onOpenUserProfile;
  }

  render() {
    this.element = this.createElement(`
      <div class="message-list" id="messageList">
        ${this.renderContent()}
      </div>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelectorAll("[data-open-user-profile]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.stopPropagation();

        const userId = element.dataset.openUserProfile;

        if (!userId || !this.onOpenUserProfile) {
          return;
        }

        this.onOpenUserProfile(userId);
      });
    });

    this.element.querySelectorAll("[data-message-id]").forEach((messageElement) => {
      messageElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const messageId = messageElement.dataset.messageId;
        const authorId = messageElement.dataset.authorId;

        if (authorId !== this.currentUser.id) {
          return;
        }

        ContextMenu.show({
          x: event.clientX,
          y: event.clientY,
          items: [
            {
              label: "Редактировать",
              icon: "✎",
              onClick: () => this.onEditMessage(messageId)
            },
            {
              label: "Удалить",
              icon: "🗑",
              danger: true,
              onClick: () => this.onDeleteMessage(messageId)
            }
          ]
        });
      });
    });

    this.scrollToBottom();
  }

  renderContent() {
    if (this.searchResults) {
      return this.renderSearchResults();
    }

    if (this.messages.length === 0) {
      return `
        <div class="empty-chat">
          <div class="empty-chat-icon">💬</div>
          <h2>Здесь пока пусто</h2>
          <p>Отправь первое сообщение в этом канале.</p>
        </div>
      `;
    }

    return this.messages
      .map((message) => this.renderMessage(message))
      .join("");
  }

  renderSearchResults() {
    if (this.searchResults.length === 0) {
      return `
        <div class="empty-chat">
          <div class="empty-chat-icon">🔎</div>
          <h2>Ничего не найдено</h2>
          <p>Попробуй другой запрос.</p>
        </div>
      `;
    }

    return `
      <div class="search-results-title">
        Найдено сообщений: ${this.searchResults.length}
      </div>

      ${this.searchResults.map((message) => this.renderMessage(message)).join("")}
    `;
  }

  renderMessage(message) {
    const author = this.authService.getUserById(message.authorId);

    return `
      <article 
        class="message"
        data-message-id="${message.id}"
        data-author-id="${message.authorId}"
      >
        <button 
          class="message-avatar profile-clickable"
          data-open-user-profile="${author?.id || ""}"
          title="Открыть профиль"
        >
          ${renderAvatar(author?.avatar, "?")}
        </button>

        <div class="message-body">
          <div class="message-meta">
            <button 
              class="message-author-button"
              data-open-user-profile="${author?.id || ""}"
              title="Открыть профиль"
            >
              ${escapeHTML(author?.username || "Unknown")}
            </button>

            <span>${formatTime(message.createdAt)}</span>
            ${message.editedAt ? `<span class="edited-label">изменено</span>` : ""}
          </div>

          <p>${escapeHTML(message.text)}</p>
        </div>
      </article>
    `;
  }

  scrollToBottom() {
    if (!this.searchResults) {
      this.element.scrollTop = this.element.scrollHeight;
    }
  }
}