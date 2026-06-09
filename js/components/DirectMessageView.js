import { Component } from "./Component.js";
import { ContextMenu } from "./ContextMenu.js";
import { formatTime, escapeHTML, renderAvatar, formatFileSize } from "../utils/helpers.js";
import { ImageViewerModal } from "./ImageViewerModal.js";

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
  onDeleteMessage,
  onOpenUserProfile,
  onToggleReaction,
  onTogglePinMessage,
  onOpenPinnedMessages
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
  this.onOpenUserProfile = onOpenUserProfile;
  this.onToggleReaction = onToggleReaction;
  this.onTogglePinMessage = onTogglePinMessage;
  this.onOpenPinnedMessages = onOpenPinnedMessages;
}

  render() {
    this.element = this.createElement(`
      <section class="chat-panel dm-panel">
        <header class="chat-header chat-header-with-search">
          <div class="dm-header-user">
            ${
              this.friend
                ? `
                  <button 
                    class="friend-avatar profile-clickable"
                    data-open-user-profile="${this.friend.id}"
                  >
                    ${renderAvatar(this.friend.avatar, "?")}
                  </button>

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

            <button 
              class="members-toggle-button" 
              id="dmPinnedMessagesButton" 
              type="button"
              title="Закреплённые сообщения"
              ${this.friend ? "" : "disabled"}
            >
              📌
            </button>

            <button type="submit" ${this.friend ? "" : "disabled"}>🔎</button>
            <button type="button" id="dmClearSearchButton">×</button>
          </form>
        </header>

        <div class="message-list dm-message-list" id="dmMessageList">
          ${this.renderMessages()}
        </div>

        <div class="attachment-preview-row" id="dmAttachmentPreview"></div>

        <form class="message-form compact-message-form" id="dmMessageForm">
          
          <button 
            class="attachment-button" 
            id="dmAttachmentButton"
            type="button"
            title="Прикрепить изображение"
            ${this.friend ? "" : "disabled"}
          >
            🖼
          </button>

          <input 
            id="dmAttachmentInput" 
            type="file" 
            accept="image/*" 
            hidden 
            ${this.friend ? "" : "disabled"}
          />

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

    this.attachmentInput = this.element.querySelector("#dmAttachmentInput");
    this.attachmentPreview = this.element.querySelector("#dmAttachmentPreview");
    this.attachmentButton = this.element.querySelector("#dmAttachmentButton");
    this.messageList = this.element.querySelector("#dmMessageList");

    if (this.attachmentButton && this.attachmentInput) {
      this.attachmentButton.addEventListener("click", () => {
        this.attachmentInput.click();
      });
    } 

    if (this.attachmentInput && this.attachmentPreview) {
      this.attachmentInput.addEventListener("change", () => {
        this.renderAttachmentPreview( 
          this.attachmentInput,
          this.attachmentPreview
        );
      });
    }

    if (this.attachmentInput && this.attachmentPreview) {
  this.element.addEventListener("paste", (event) => {
    this.handleImagePaste(
      event,
      this.attachmentInput,
      this.attachmentPreview
    );
  });
}

if (this.messageList && this.attachmentInput && this.attachmentPreview) {
  this.messageList.addEventListener("dragover", (event) => {
    event.preventDefault();
    this.messageList.classList.add("drag-over");
  });

  this.messageList.addEventListener("dragleave", (event) => {
    if (!this.messageList.contains(event.relatedTarget)) {
      this.messageList.classList.remove("drag-over");
    }
  });

  this.messageList.addEventListener("drop", (event) => {
    event.preventDefault();
    this.messageList.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      this.attachmentPreview.innerHTML = `
        <div class="attachment-preview-error">
          Можно перетаскивать только изображения.
        </div>
      `;
      this.attachmentPreview.classList.add("active");
      return;
    }

    const maxSize = 1024 * 1024 * 1.5;

    if (file.size > maxSize) {
      this.attachmentPreview.innerHTML = `
        <div class="attachment-preview-error">
          Картинка слишком большая. Максимум 1.5 MB.
        </div>
      `;
      this.attachmentPreview.classList.add("active");
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    this.attachmentInput.files = dataTransfer.files;

    this.renderAttachmentPreview(
      this.attachmentInput,
      this.attachmentPreview
    );
  });
}
    
    this.messageList = this.element.querySelector("#dmMessageList");

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!this.friend) {
        return;
      }

      const file = this.attachmentInput.files[0] || null;
      const text = this.input.value;

      this.onSendMessage(text, file);

      this.input.value = "";

      if (this.attachmentInput) {
        this.attachmentInput.value = "";
      }

      if (this.attachmentPreview) {
        this.attachmentPreview.innerHTML = "";
        this.attachmentPreview.classList.remove("active");
      }
    });

    this.element.querySelector("#dmSearchForm").addEventListener("submit", (event) => {
      event.preventDefault();

      const input = this.element.querySelector("#dmSearchInput");
      this.onSearch(input.value);
    });

    this.element.querySelector("#dmClearSearchButton").addEventListener("click", () => {
      this.onClearSearch();
    });

    this.element.querySelectorAll("[data-open-dm-image]").forEach((image) => {
  image.addEventListener("click", () => {
    const messageId = image.dataset.messageId;
    const message = this.messages.find((item) => item.id === messageId);

    if (!message || !message.attachment) {
      return;
    }

    const viewer = new ImageViewerModal({
      attachment: message.attachment
    });

    viewer.open();
  });
});

    this.element.querySelectorAll("[data-open-user-profile]").forEach((element) => {
      element.addEventListener("click", () => {
        const userId = element.dataset.openUserProfile;

        if (userId && this.onOpenUserProfile) {
          this.onOpenUserProfile(userId);
        }
      });
    });

    this.element.querySelectorAll("[data-dm-id]").forEach((messageElement) => {
      messageElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        const messageId = messageElement.dataset.dmId;
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

    this.element.querySelectorAll("[data-dm-reaction]").forEach((button) => {
      button.addEventListener("click", () => {
        const messageId = button.dataset.messageId;
        const emoji = button.dataset.dmReaction;

        this.onToggleReaction(messageId, emoji);
      });
    });

    this.element.querySelectorAll("[data-add-dm-reaction]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const messageId = button.dataset.addDmReaction;

        this.openReactionMenu(event.clientX, event.clientY, messageId);
      });
    });

    if (!this.searchResults) {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }

    const pinnedButton = this.element.querySelector("#dmPinnedMessagesButton");

    if (pinnedButton) {
      pinnedButton.addEventListener("click", () => {
        if (this.onOpenPinnedMessages) {
          this.onOpenPinnedMessages();
    }
  });
}
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

  handleImagePaste(event, input, previewElement) {
  const items = Array.from(event.clipboardData?.items || []);

  const imageItem = items.find((item) => {
    return item.type.startsWith("image/");
  });

  if (!imageItem) {
    return;
  }

  event.preventDefault();

  const file = imageItem.getAsFile();

  if (!file) {
    return;
  }

  const maxSize = 1024 * 1024 * 1.5;

  if (file.size > maxSize) {
    previewElement.innerHTML = `
      <div class="attachment-preview-error">
        Картинка слишком большая. Максимум 1.5 MB.
      </div>
    `;

    previewElement.classList.add("active");
    return;
  }

  const pastedFile = new File(
    [file],
    `pasted-image-${Date.now()}.png`,
    { type: file.type || "image/png" }
  );

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(pastedFile);

  input.files = dataTransfer.files;

  this.renderAttachmentPreview(input, previewElement);
}

renderAttachmentPreview(input, previewElement) {
  const file = input.files[0];

  if (!file) {
    previewElement.innerHTML = "";
    previewElement.classList.remove("active");
    return;
  }

  if (!file.type.startsWith("image/")) {
    previewElement.innerHTML = `
      <div class="attachment-preview-error">
        Можно прикреплять только изображения.
      </div>
    `;

    previewElement.classList.add("active");
    input.value = "";
    return;
  }

  const maxSize = 1024 * 1024 * 1.5;

  if (file.size > maxSize) {
    previewElement.innerHTML = `
      <div class="attachment-preview-error">
        Картинка слишком большая. Максимум 1.5 MB.
      </div>
    `;

    previewElement.classList.add("active");
    input.value = "";
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  previewElement.innerHTML = `
    <div class="attachment-preview-card">
      <img src="${imageUrl}" alt="Предпросмотр изображения" />

      <div class="attachment-preview-info">
        <strong>${file.name}</strong>
        <span>Картинка прикреплена</span>
      </div>

      <button
        class="attachment-preview-remove"
        type="button"
        id="clearDmAttachmentButton"
        title="Убрать изображение"
      >
        ×
      </button>
    </div>
  `;

  previewElement.classList.add("active");

  previewElement
    .querySelector("#clearDmAttachmentButton")
    .addEventListener("click", () => {
      input.value = "";
      previewElement.innerHTML = "";
      previewElement.classList.remove("active");
      URL.revokeObjectURL(imageUrl);
    });
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
          class="message dm-message ${isOwn ? "own-message" : ""} ${message.isPinned ? "pinned-message" : ""}"
          data-dm-id="${message.id}"
          data-author-id="${message.authorId}"
          data-pinned="${message.isPinned ? "true" : "false"}"
        >
        <button 
          class="message-avatar profile-clickable"
          data-open-user-profile="${author?.id || ""}"
        >
          ${renderAvatar(author?.avatar, "?")}
        </button>

        <div class="message-body dm-message-body">
          <div class="message-meta">
            <button 
              class="message-author-button"
              data-open-user-profile="${author?.id || ""}"
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
              data-add-dm-reaction="${message.id}"
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
          data-open-dm-image
          data-message-id="${message.id}"
        />
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
            data-dm-reaction="${escapeHTML(emoji)}"
          >
            <span>${escapeHTML(emoji)}</span>
            <strong>${userIds.length}</strong>
          </button>
        `;
      })
      .join("");
  }
}