import { Component } from "./Component.js";
import { ContextMenu } from "./ContextMenu.js";
import { formatTime, escapeHTML, renderAvatar, formatFileSize } from "../utils/helpers.js";
import { ImageViewerModal } from "./ImageViewerModal.js";

export class MessageList extends Component {
  constructor({
    messages,
    searchResults = null,
    authService,
    currentUser,
    onDeleteMessage,
    onEditMessage,
    onOpenUserProfile,
    onToggleReaction,
    onTogglePinMessage
  }) {
    super();

    this.messages = messages;
    this.searchResults = searchResults;
    this.authService = authService;
    this.currentUser = currentUser;
    this.onDeleteMessage = onDeleteMessage;
    this.onEditMessage = onEditMessage;
    this.onOpenUserProfile = onOpenUserProfile;
    this.onToggleReaction = onToggleReaction;
    this.onTogglePinMessage = onTogglePinMessage;
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

    this.element.querySelectorAll("[data-open-image]").forEach((image) => {
  image.addEventListener("click", () => {
    const messageId = image.dataset.messageId;
    const message = this.messages.find((item) => item.id === messageId);

    if (!message || !message.attachment) {
      return;
    }

    const viewer = new ImageViewerModal({
      attachment: message.attachment,
      messageId: message.id,
      onGoToMessage: (messageId) => this.scrollToMessage(messageId)
    });

    viewer.open();
  });
});

this.element.querySelectorAll("[data-image-menu]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const messageId = button.dataset.messageId;
    const message = this.messages.find((item) => item.id === messageId);

    if (!message || !message.attachment) {
      return;
    }

    this.openImageMenu(
      event.clientX,
      event.clientY,
      message
    );
  });
}); 

    this.element.querySelectorAll("[data-message-id]").forEach((messageElement) => {
      messageElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const messageId = messageElement.dataset.messageId;
        const authorId = messageElement.dataset.authorId;

        const items = [];

        items.push({
          label: "Поставить реакцию",
          icon: "😀",
          onClick: () => this.openReactionMenu(event.clientX, event.clientY, messageId)
        });

        items.push({
          label: messageElement.dataset.pinned === "true" ? "Открепить" : "Закрепить",
          icon: "📌",
          onClick: () => this.onTogglePinMessage(messageId)
        });

        if (authorId === this.currentUser.id) {
          items.push({
            label: "Редактировать",
            icon: "✎",
            onClick: () => this.onEditMessage(messageId)
          });

          items.push({
            label: "Удалить",
            icon: "🗑",
            danger: true,
            onClick: () => this.onDeleteMessage(messageId)
          });
        }

        ContextMenu.show({
          x: event.clientX,
          y: event.clientY,
          items
        });
      });
    });

    this.element.querySelectorAll("[data-reaction]").forEach((button) => {
      button.addEventListener("click", () => {
        const messageId = button.dataset.messageId;
        const emoji = button.dataset.reaction;

        this.onToggleReaction(messageId, emoji);
      });
    });

    this.element.querySelectorAll("[data-add-reaction]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const messageId = button.dataset.addReaction;

        this.openReactionMenu(event.clientX, event.clientY, messageId);
      });
    });

    this.scrollToBottom();
  }

  openImageMenu(x, y, message) {
  const attachment = message.attachment;

  ContextMenu.show({
    x,
    y,
    items: [
      {
        label: "Скачать",
        icon: "⬇",
        onClick: () => this.downloadAttachment(attachment)
      },
      {
        label: "Открыть в браузере",
        icon: "↗",
        onClick: () => this.openAttachmentInBrowser(attachment)
      },
      {
        label: "Поделиться",
        icon: "⤴",
        onClick: () => this.shareAttachment(attachment)
      },
      {
        label: "Перейти к сообщению",
        icon: "➜",
        onClick: () => this.scrollToMessage(message.id)
      }
    ]
  });
}

downloadAttachment(attachment) {
  const link = document.createElement("a");

  link.href = attachment.dataUrl;
  link.download = attachment.name || `bobmess-image-${Date.now()}.png`;

  document.body.appendChild(link);
  link.click();
  link.remove();
}

openAttachmentInBrowser(attachment) {
  const tab = window.open();

  if (!tab) {
    return;
  }

  tab.document.write(`
    <title>BobMess Image</title>
    <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <img
        src="${attachment.dataUrl}"
        style="max-width:100vw;max-height:100vh;object-fit:contain;"
        alt="Изображение"
      />
    </body>
  `);

  tab.document.close();
}

async shareAttachment(attachment) {
  if (!navigator.share) {
    await navigator.clipboard.writeText(attachment.dataUrl);
    return;
  }

  try {
    await navigator.share({
      title: "Изображение из BobMess",
      text: "Изображение из BobMess",
      url: attachment.dataUrl
    });
  } catch (error) {
    // Пользователь мог просто закрыть окно шаринга.
  }
}

scrollToMessage(messageId) {
  const messageElement = this.element.querySelector(
    `[data-message-id="${messageId}"]`
  );

  if (!messageElement) {
    return;
  }

  messageElement.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  messageElement.classList.add("message-highlight");

  setTimeout(() => {
    messageElement.classList.remove("message-highlight");
  }, 1400);
}

  openReactionMenu(x, y, messageId) {
    const emojis = ["👍", "❤️", "😂", "🔥", "😮", "😢", "👏", "💀"];

    ContextMenu.show({
      x,
      y,
      items: emojis.map((emoji) => {
        return {
          label: emoji,
          icon: "",
          onClick: () => this.onToggleReaction(messageId, emoji)
        };
      })
    });
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
          class="message ${message.isPinned ? "pinned-message" : ""}"
          data-message-id="${message.id}"
          data-author-id="${message.authorId}"
          data-pinned="${message.isPinned ? "true" : "false"}"
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
            ${message.isPinned ? `<span class="pinned-label">📌 закреплено</span>` : ""}
          </div>

          ${message.text ? `<p>${escapeHTML(message.text)}</p>` : ""}

          ${this.renderAttachment(message)}

          <div class="message-reactions">
            ${this.renderReactions(message)}

            <button 
              class="add-reaction-button" 
              data-add-reaction="${message.id}"
              title="Добавить реакцию"
            >
              +
            </button>
          </div>
        </div>
      </article>
    `;
  }

  renderAttachment(message) {
  const attachment = message.attachment;

  if (!attachment) {
    return "";
  }

  if (attachment.type === "image") {
    return `
      <div class="message-attachment image-attachment">
        <img
          src="${attachment.dataUrl}"
          alt="Изображение"
          data-open-image
          data-message-id="${message.id}"
        />

        <button
          class="attachment-menu-button"
          type="button"
          data-image-menu
          data-message-id="${message.id}"
          title="Действия с изображением"
        >
          ⋯
        </button>
      </div>
    `;
  }

  return "";
}

  renderReactions(message) {
    const reactions = message.reactions || {};
    const entries = Object.entries(reactions);

    if (entries.length === 0) {
      return "";
    }

    return entries
      .map(([emoji, userIds]) => {
        const active = userIds.includes(this.currentUser.id) ? "active" : "";

        return `
          <button 
            class="reaction-pill ${active}"
            data-message-id="${message.id}"
            data-reaction="${escapeHTML(emoji)}"
          >
            <span>${escapeHTML(emoji)}</span>
            <strong>${userIds.length}</strong>
          </button>
        `;
      })
      .join("");
  }

  scrollToBottom() {
    if (!this.searchResults) {
      this.element.scrollTop = this.element.scrollHeight;
    }
  }
}