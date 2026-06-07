import { Component } from "./Component.js";
import { ContextMenu } from "./ContextMenu.js";
import { formatTime, escapeHTML, renderAvatar } from "../utils/helpers.js";

export class DirectMessageView extends Component {
  constructor({
    currentUser,
    friend,
    messages,
    searchResults = null,
    userService,
    onSendMessage,
    onSearch,
    onClearSearch,
    onEditMessage,
    onDeleteMessage
  }) {
    super();

    this.currentUser = currentUser;
    this.friend = friend;
    this.messages = messages;
    this.searchResults = searchResults;
    this.userService = userService;

    this.onSendMessage = onSendMessage;
    this.onSearch = onSearch;
    this.onClearSearch = onClearSearch;
    this.onEditMessage = onEditMessage;
    this.onDeleteMessage = onDeleteMessage;
  }

  render() {
    this.element = this.createElement(`
      <section class="chat-panel dm-panel">
        <header class="chat-header chat-header-with-search">
          <div class="dm-header-user">
            ${
              this.friend
                ? `
                  <div class="friend-avatar">${renderAvatar(this.friend.avatar, "?")}</div>
                  <div>
                    <h1>${escapeHTML(this.friend.username)}</h1>
                    <p>${escapeHTML(this.friend.status || "online")}</p>
                  </div>
                `
                : `
                  <div>
                    <h1>Выбери друга</h1>
                    <p>Личные сообщения BOB</p>
                  </div>
                `
            }
          </div>

          <form class="chat-search-form" id="dmSearchForm">
            <input
              id="dmSearchInput"
              type="text"
              placeholder="Поиск..."
              ${this.friend ? "" : "disabled"}
            />

            <button type="submit" ${this.friend ? "" : "disabled"}>🔎</button>
            <button type="button" id="dmClearSearchButton">×</button>
          </form>
        </header>

        <div class="message-list dm-message-list" id="dmMessageList">
          ${this.renderMessages()}
        </div>

        <form class="message-form compact-message-form" id="dmMessageForm">
          <input
            id="dmMessageInput"
            type="text"
            placeholder="${this.friend ? `Сообщение для ${escapeHTML(this.friend.username)}...` : "Выбери друга..."}"
            autocomplete="off"
            ${this.friend ? "" : "disabled"}
          />

          <button type="submit" ${this.friend ? "" : "disabled"}>
            ➤
          </button>
        </form>
      </section>
    `);

    return this.element;
  }

  afterRender() {
    this.form = this.element.querySelector("#dmMessageForm");
    this.input = this.element.querySelector("#dmMessageInput");
    this.messageList = this.element.querySelector("#dmMessageList");

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!this.friend) {
        return;
      }

      this.onSendMessage(this.input.value);
    });

    this.element.querySelector("#dmSearchForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const input = this.element.querySelector("#dmSearchInput");
      this.onSearch(input.value);
    });

    this.element.querySelector("#dmClearSearchButton").addEventListener("click", () => {
      this.onClearSearch();
    });

    this.element.querySelectorAll("[data-dm-id]").forEach((messageElement) => {
      messageElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const messageId = messageElement.dataset.dmId;
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

    if (!this.searchResults) {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }
  }

  renderMessages() {
    if (!this.friend) {
      return `
        <div class="empty-chat">
          <div class="empty-chat-icon">👥</div>
          <h2>Личные сообщения</h2>
          <p>Выбери друга слева или добавь нового.</p>
        </div>
      `;
    }

    if (this.searchResults) {
      return this.renderSearchResults();
    }

    if (this.messages.length === 0) {
      return `
        <div class="empty-chat">
          <div class="empty-chat-icon">💌</div>
          <h2>Диалог пустой</h2>
          <p>Напиши первое личное сообщение.</p>
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
    const author = this.userService.getUserById(message.authorId);
    const isOwn = message.authorId === this.currentUser.id;

    return `
      <article 
        class="message dm-message ${isOwn ? "own-message" : ""}"
        data-dm-id="${message.id}"
        data-author-id="${message.authorId}"
      >
        <div class="message-avatar">
          ${renderAvatar(author?.avatar, "?")}
        </div>

        <div class="message-body dm-message-body">
          <div class="message-meta">
            <strong>${escapeHTML(author?.username || "Unknown")}</strong>
            <span>${formatTime(message.createdAt)}</span>
            ${message.editedAt ? `<span class="edited-label">изменено</span>` : ""}
          </div>

          <p>${escapeHTML(message.text)}</p>
        </div>
      </article>
    `;
  }
}