import { Component } from "./Component.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class ServerMembersSidebar extends Component {
  constructor({
    server,
    users,
    currentUser,
    roleService,
    onOpenUserProfile
  }) {
    super();

    this.server = server;
    this.users = users;
    this.currentUser = currentUser;
    this.roleService = roleService;
    this.onOpenUserProfile = onOpenUserProfile;
  }

  render() {
    const members = this.getMembers();

    this.element = this.createElement(`
      <aside class="members-sidebar">
        <header class="members-header">
          <h3>Участники</h3>
          <span>${members.length}</span>
        </header>

        <div class="members-list">
          ${members.map((user) => this.renderMember(user)).join("")}
        </div>
      </aside>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelectorAll("[data-open-user-profile]").forEach((button) => {
      button.addEventListener("click", () => {
        this.onOpenUserProfile(button.dataset.openUserProfile);
      });
    });
  }

  getMembers() {
    const memberIds = this.server.members || [];

    return this.users.filter((user) => memberIds.includes(user.id));
  }

  renderMember(user) {
    const roleLabel = this.roleService.getRoleLabel(this.server.id, user.id);
    const isCurrentUser = user.id === this.currentUser.id;

    return `
      <button 
        class="member-sidebar-item ${isCurrentUser ? "current" : ""}"
        data-open-user-profile="${user.id}"
        title="Открыть профиль"
      >
        <div class="member-sidebar-avatar">
          ${renderAvatar(user.avatar, "?")}
        </div>

        <div class="member-sidebar-info">
          <strong>${escapeHTML(user.username)}</strong>
          <span>${escapeHTML(user.status || "online")}</span>
        </div>

        <div class="member-sidebar-role">
          ${escapeHTML(roleLabel)}
        </div>
      </button>
    `;
  }
}