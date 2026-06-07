import { Component } from "./Component.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class ChannelList extends Component {
  constructor({
    server,
    onOpenProfile,  
    currentChannelId,
    currentUser,
    onSelectChannel,
    onCreateChannel,
    onRenameChannel,
    onDeleteChannel,
    notificationService,
    canManageServer,
    canManageChannels,
    onOpenSettings,
    onToggleTheme,
    onLogout
  }) {
    super();

    this.server = server;
    this.currentChannelId = currentChannelId;
    this.currentUser = currentUser;
    this.notificationService = notificationService;
    this.canManageServer = canManageServer;
    this.canManageChannels = canManageChannels;

    this.onSelectChannel = onSelectChannel;
    this.onOpenProfile = onOpenProfile;
    this.onCreateChannel = onCreateChannel;
    this.onRenameChannel = onRenameChannel;
    this.onDeleteChannel = onDeleteChannel;
    this.onOpenSettings = onOpenSettings;
    this.onToggleTheme = onToggleTheme;
    this.onLogout = onLogout;
  }

  render() {
    this.element = this.createElement(`
      <aside class="channel-sidebar">
        <header class="server-header">
          <div>
            <h2>${escapeHTML(this.server.name)}</h2>
            <span>${this.server.channels.length} каналов</span>
          </div>

          ${
          this.canManageServer
            ? `
              <button id="serverSettingsButton" class="icon-button" title="Настройки сервера">
                ⚙
              </button>
            `
            : ""
        }
        </header>

        <section class="channels-section">
          <div class="section-title">
            <span>Текстовые каналы</span>

            <button id="createChannelButton" title="Создать канал">
              +
            </button>
          </div>

          <div class="channel-list">
            ${this.renderChannels()}
          </div>
        </section>

        <footer class="user-panel">
            <button class="user-profile-button" id="openProfileButton" title="Открыть профиль">
            <div class="user-avatar">
                ${renderAvatar(this.currentUser.avatar)}
            </div>

            <div class="user-info">
                <strong>${escapeHTML(this.currentUser.username)}</strong>
                <span>${escapeHTML(this.currentUser.status || "online")}</span>
            </div>
            </button>

          <button id="themeButton" title="Сменить тему">🌓</button>
          <button id="logoutButton" title="Выйти">⏻</button>
        </footer>
      </aside>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelectorAll("[data-channel-id]").forEach((button) => {
      button.addEventListener("click", () => {
        this.onSelectChannel(button.dataset.channelId);
      });
    });

    this.element.querySelectorAll("[data-rename-channel]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onRenameChannel(button.dataset.renameChannel);
      });
    });

    this.element.querySelectorAll("[data-delete-channel]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onDeleteChannel(button.dataset.deleteChannel);
      });
    });

    this.element
      .querySelector("#createChannelButton")
      .addEventListener("click", () => {
        this.onCreateChannel();
      });

    const settingsButton = this.element.querySelector("#serverSettingsButton");

    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        this.onOpenSettings();
      });
    }
    this.element
        .querySelector("#openProfileButton")
        .addEventListener("click", () => {
            this.onOpenProfile();
    });

    this.element.querySelector("#themeButton").addEventListener("click", () => {
      this.onToggleTheme();
    });

    this.element.querySelector("#logoutButton").addEventListener("click", () => {
      this.onLogout();
    });
  }

  renderChannels() {
    return this.server.channels
      .map((channel) => {
        const isActive = channel.id === this.currentChannelId ? "active" : "";
        const unreadCount = this.notificationService.getUnreadChannelCount(
        this.currentUser.id,
        channel.id
        );

        return `
  <div class="channel-row ${isActive}">
    <button 
      class="channel-button" 
      data-channel-id="${channel.id}"
    >
      <span>
        <span class="channel-hash">#</span>
        ${escapeHTML(channel.name)}
      </span>

      ${unreadCount > 0 ? `<span class="channel-unread-badge">${unreadCount}</span>` : ""}
    </button>

    <div class="channel-actions">
      <button data-rename-channel="${channel.id}" title="Переименовать канал">
        ✎
      </button>

      <button data-delete-channel="${channel.id}" title="Удалить канал">
        ×
      </button>
    </div>
  </div>
`;
      })
      .join("");
  }
}