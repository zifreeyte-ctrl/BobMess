import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class ServerMembersPanel {
  constructor({
    server,
    users,
    currentUser,
    roleService,
    onAssignRole,
    onRemoveRole
  }) {
    this.server = server;
    this.users = users;
    this.currentUser = currentUser;
    this.roleService = roleService;
    this.onAssignRole = onAssignRole;
    this.onRemoveRole = onRemoveRole;
  }

  render() {
    const members = this.getMembers();
    const canManageRoles = this.roleService.hasPermission(
      this.server.id,
      this.currentUser.id,
      "manageRoles"
    );

    return `
      <section class="server-members-panel">
        <div class="settings-row">
          <div>
            <strong>Участники сервера</strong>
            <p class="muted-text">${members.length} участников</p>
          </div>
        </div>

        <div class="server-member-list">
          ${members
            .map((user) => this.renderMember(user, canManageRoles))
            .join("")}
        </div>
      </section>
    `;
  }

  getMembers() {
    const memberIds = this.server.members || [];

    return this.users.filter((user) => memberIds.includes(user.id));
  }

  renderMember(user, canManageRoles) {
    const roleLabel = this.roleService.getRoleLabel(this.server.id, user.id);
    const userRoles = this.roleService.getUserRoles(this.server.id, user.id);
    const roles = this.roleService.getAssignableRoles(this.server.id);
    const isOwner = this.server.ownerId === user.id;

    return `
      <article class="server-member-card">
        <div class="server-member-main">
          <div class="member-avatar server-member-avatar">
            ${renderAvatar(user.avatar, "?")}
          </div>

          <div>
            <strong>${escapeHTML(user.username)}</strong>
            <p>${escapeHTML(user.status || "online")}</p>
          </div>
        </div>

        <div class="server-member-role">
          <span>${escapeHTML(roleLabel)}</span>
        </div>

        ${
          userRoles.length > 0
            ? `
              <div class="server-member-role-pills">
                ${userRoles
                  .map((role) => {
                    const canRemove =
                      canManageRoles &&
                      !isOwner &&
                      role.name !== "Owner";

                    return `
                      <button 
                        class="role-pill"
                        data-remove-role="${role.id}"
                        data-user-id="${user.id}"
                        ${canRemove ? "" : "disabled"}
                      >
                        ${escapeHTML(role.name)} ${canRemove ? "×" : ""}
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            `
            : `
              <div class="server-member-role-pills">
                <span class="muted-text">Без роли</span>
              </div>
            `
        }

        ${
          canManageRoles && !isOwner
            ? `
              <div class="server-member-actions">
                <select data-role-select="${user.id}">
                  ${roles
                    .map((role) => {
                      return `
                        <option value="${role.id}">
                          ${escapeHTML(role.name)}
                        </option>
                      `;
                    })
                    .join("")}
                </select>

                <button data-assign-role data-user-id="${user.id}">
                  Выдать
                </button>
              </div>
            `
            : ""
        }
      </article>
    `;
  }

  bindEvents(rootElement) {
    rootElement.querySelectorAll("[data-assign-role]").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.dataset.userId;
        const select = rootElement.querySelector(`[data-role-select="${userId}"]`);
        const roleId = select.value;

        this.onAssignRole(userId, roleId);
      });
    });

    rootElement.querySelectorAll("[data-remove-role]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }

        this.onRemoveRole(button.dataset.userId, button.dataset.removeRole);
      });
    });
  }
}