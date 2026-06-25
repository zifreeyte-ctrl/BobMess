import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";
import { escapeHTML } from "../utils/helpers.js";

export class ServerAdminModal {
  constructor({
    server,
    users,
    currentUser,
    roleService,
    onUpdate
  }) {
    this.server = server;
    this.users = users;
    this.currentUser = currentUser;
    this.roleService = roleService;
    this.onUpdate = onUpdate;
  }

  open() {
    const modal = new Modal({
      title: "Админка сервера",
      confirmText: "Закрыть",
      content: `
        <div class="admin-panel">
          <section class="admin-section">
            <h3>Права ролей</h3>

            <div class="role-grid">
              ${this.renderRoles()}
            </div>
          </section>

          <section class="admin-section">
            <h3>Пользователи и роли</h3>

            <div class="member-list">
              ${this.renderMembers()}
            </div>
          </section>
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();

    modal.element.querySelectorAll("[data-assign-role]").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.dataset.userId;
        const select = modal.element.querySelector(`[data-role-select="${userId}"]`);
        const roleId = select.value;

        try {
          this.roleService.assignRole(
            this.server.id,
            userId,
            roleId,
            this.currentUser.id
          );

          Toast.show("Роль назначена.");
          modal.close();

          if (this.onUpdate) {
            this.onUpdate();
          }
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
    });

    modal.element.querySelectorAll("[data-remove-role]").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.dataset.userId;
        const roleId = button.dataset.roleId;

        try {
          this.roleService.removeRole(
            this.server.id,
            userId,
            roleId,
            this.currentUser.id
          );

          Toast.show("Роль удалена.");
          modal.close();

          if (this.onUpdate) {
            this.onUpdate();
          }
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
    });
  }

  renderRoles() {
    return this.server.roles
      .map((role) => {
        return `
          <article class="role-card">
            <div class="role-card-title">
              <span style="background:${escapeHTML(role.color)}"></span>
              <strong>${escapeHTML(role.name)}</strong>
            </div>

            <ul>
              <li>${role.permissions.manageServer ? "✅" : "❌"} Управление сервером</li>
              <li>${role.permissions.manageChannels ? "✅" : "❌"} Управление каналами</li>
              <li>${role.permissions.manageMessages ? "✅" : "❌"} Управление сообщениями</li>
              <li>${role.permissions.manageRoles ? "✅" : "❌"} Управление ролями</li>
              <li>${role.permissions.sendMessages ? "✅" : "❌"} Отправка сообщений</li>
            </ul>
          </article>
        `;
      })
      .join("");
  }

  renderMembers() {
    return this.users
      .map((user) => {
        const userRoles = this.roleService.getUserRoles(this.server.id, user.id);
        const roleLabel = this.roleService.getRoleLabel(this.server.id, user.id);

        return `
          <article class="member-card">
            <div class="member-main">
              <div class="member-avatar">${escapeHTML(user.avatar || "?")}</div>

              <div>
                <strong>${escapeHTML(user.username)}</strong>
                <p>${escapeHTML(roleLabel)}</p>
              </div>
            </div>

            <div class="member-roles">
              ${
                userRoles.length === 0
                  ? `<span class="muted-text">Нет ролей</span>`
                  : userRoles
                      .map((role) => {
                        return `
                          <button 
                            class="role-pill"
                            data-remove-role="${role.id}"
                            data-user-id="${user.id}"
                            data-role-id="${role.id}"
                            title="Убрать роль"
                          >
                            ${escapeHTML(role.name)} ×
                          </button>
                        `;
                      })
                      .join("")
              }
            </div>

            <div class="member-actions">
              <select data-role-select="${user.id}">
                ${this.server.roles
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
                Выдать роль
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }
}