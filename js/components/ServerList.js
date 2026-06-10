import { Component } from "./Component.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js"; 

export class ServerList extends Component {
  constructor({
    servers,
    currentServerId,
    mode,
    currentUser,
    friends,
    notificationService,
    friendRequestCount = 0,
    onSelectServer,
    onCreateServer,
    onOpenDirectMessages
  }) {
    super();

    this.servers = servers;
    this.currentServerId = currentServerId;
    this.mode = mode;
    this.currentUser = currentUser;
    this.friends = friends || [];
    this.notificationService = notificationService;
    this.friendRequestCount = friendRequestCount;

    this.onSelectServer = onSelectServer;
    this.onCreateServer = onCreateServer;
    this.onOpenDirectMessages = onOpenDirectMessages;
  }

  render() {
    const totalDmUnread = this.notificationService.getTotalUnreadDialogsCount(
      this.currentUser.id,
      this.friends
    );
    const totalDmBadge = totalDmUnread + this.friendRequestCount;

    this.element = this.createElement(`
      <aside class="server-bar">
        <button
          class="server-item dm-server-button ${this.mode === "dm" ? "active" : ""}"
          id="directMessagesButton"
          title="Личные сообщения"
        >
          💬
          ${
            totalDmBadge > 0
              ? `<span class="unread-badge">${totalDmBadge}</span>`
              : ""
          }
        </button>

        <div class="server-divider"></div>

        <div class="server-list">
          ${this.renderServers()}
        </div>

        <button class="server-item create-server-button" id="createServerButton" title="Создать сервер">
          +
        </button>
      </aside>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelector("#directMessagesButton").addEventListener("click", () => {
      this.onOpenDirectMessages();
    });

    this.element.querySelectorAll("[data-server-id]").forEach((button) => {
      button.addEventListener("click", () => {
        this.onSelectServer(button.dataset.serverId);
      });
    });

    this.element
      .querySelector("#createServerButton")
      .addEventListener("click", () => {
        this.onCreateServer();
      });
  }

  renderServers() {
    return this.servers
      .map((server) => {
        const isActive =
          this.mode === "server" && server.id === this.currentServerId
            ? "active"
            : "";

        const unreadCount = this.notificationService.getUnreadServerCount(
          this.currentUser.id,
          server
        );

        return `
          <button 
            class="server-item ${isActive}" 
            data-server-id="${server.id}"
            title="${escapeHTML(server.name)}"
          >
            ${renderAvatar(server.icon, "S")}
            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ""}
          </button>
        `;
      })
      .join("");
  }
}