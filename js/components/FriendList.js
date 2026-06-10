import { Component } from "./Component.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class FriendList extends Component {
  constructor({
    friends,
    currentFriendId,
    onSelectFriend,
    onAddFriend,
    onRemoveFriend,
    onBlockFriend,
    onBackToServers,
    currentUser,
    notificationService,
    userService,
    incomingRequests = [],
    outgoingRequests = [],
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onCancelFriendRequest
  }) {
    super();

    this.friends = friends;
    this.currentUser = currentUser;
    this.notificationService = notificationService;
    this.currentFriendId = currentFriendId;
    this.onSelectFriend = onSelectFriend;
    this.onAddFriend = onAddFriend;
    this.onRemoveFriend = onRemoveFriend;
    this.onBlockFriend = onBlockFriend;
    this.onBackToServers = onBackToServers;

    this.userService = userService;
    this.incomingRequests = incomingRequests;
    this.outgoingRequests = outgoingRequests;
    this.onAcceptFriendRequest = onAcceptFriendRequest;
    this.onRejectFriendRequest = onRejectFriendRequest;
    this.onCancelFriendRequest = onCancelFriendRequest;
  }

  render() {
    const requestCount = this.incomingRequests.length;

    this.element = this.createElement(`
      <aside class="dm-sidebar">
        <div class="dm-sidebar-header">
          <div>
            <h2>Личные сообщения</h2>
            <span>${this.friends.length} друзей</span>
          </div>

          <button class="icon-button" id="backToServersButton" title="Назад к серверам">
            ↩
          </button>
        </div>

        <div class="dm-sidebar-section">
          <div class="dm-section-title">
            <span>Друзья</span>

            ${
              requestCount > 0
                ? `<span class="friend-request-badge">${requestCount}</span>`
                : ""
            }

            <button class="small-action-button" id="addFriendButton" title="Добавить друга">
              +
            </button>
          </div>

          ${this.renderFriendRequests()}
          ${this.renderFriends()}
        </div>
      </aside>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelector("#addFriendButton").addEventListener("click", () => {
      this.onAddFriend();
    });

    this.element.querySelector("#backToServersButton").addEventListener("click", () => {
      this.onBackToServers();
    });

    this.element.querySelectorAll("[data-friend-id]").forEach((button) => {
      button.addEventListener("click", () => {
        this.onSelectFriend(button.dataset.friendId);
      });
    });

    this.element.querySelectorAll("[data-remove-friend]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onRemoveFriend(button.dataset.removeFriend);
      });
    });

    this.element.querySelectorAll("[data-block-friend]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onBlockFriend(button.dataset.blockFriend);
      });
    });

    this.element.querySelectorAll("[data-accept-request]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onAcceptFriendRequest(button.dataset.acceptRequest);
      });
    });

    this.element.querySelectorAll("[data-reject-request]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onRejectFriendRequest(button.dataset.rejectRequest);
      });
    });

    this.element.querySelectorAll("[data-cancel-request]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onCancelFriendRequest(button.dataset.cancelRequest);
      });
    });
  }

  renderFriendAvatar(user) {
  const username = user.username || "?";
  const letter = username.charAt(0).toUpperCase();

  const hasImageAvatar =
    user.avatar &&
    (
      user.avatar.startsWith("data:image/") ||
      user.avatar.startsWith("blob:") ||
      user.avatar.startsWith("http://") ||
      user.avatar.startsWith("https://")
    );

  if (!hasImageAvatar) {
    return `
      <span class="friend-avatar">
        ${escapeHTML(letter)}
      </span>
    `;
  }

  return `
    <span class="friend-avatar">
      <img
        src="${user.avatar}"
        alt=""
        onerror="this.remove(); this.parentElement.textContent='${escapeHTML(letter)}';"
      />
    </span>
  `;
}

  renderFriendRequests() {
    const hasIncoming = this.incomingRequests.length > 0;
    const hasOutgoing = this.outgoingRequests.length > 0;

    if (!hasIncoming && !hasOutgoing) {
      return "";
    }

    return `
      <div class="friend-requests-block">
        ${hasIncoming ? this.renderIncomingRequests() : ""}
        ${hasOutgoing ? this.renderOutgoingRequests() : ""}
      </div>
    `;
  }

  renderIncomingRequests() {
    return `
      <div class="friend-request-group">
        <div class="friend-request-title">Входящие заявки</div>

        ${this.incomingRequests
          .map((request) => {
            const user = this.userService.getUserById(request.fromUserId);

            if (!user) {
              return "";
            }

            return `
              <div class="friend-request-card">
                ${this.renderFriendAvatar(user)}

                <div class="friend-request-info">
                  <strong>${escapeHTML(user.username)}</strong>
                  <span>Хочет добавить тебя в друзья</span>
                </div>

                <div class="friend-request-actions">
                  <button
                    class="friend-request-accept"
                    type="button"
                    data-accept-request="${request.id}"
                    title="Принять"
                  >
                    ✓
                  </button>

                  <button
                    class="friend-request-reject"
                    type="button"
                    data-reject-request="${request.id}"
                    title="Отклонить"
                  >
                    ×
                  </button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  renderOutgoingRequests() {
    return `
      <div class="friend-request-group">
        <div class="friend-request-title">Исходящие заявки</div>

        ${this.outgoingRequests
          .map((request) => {
            const user = this.userService.getUserById(request.toUserId);

            if (!user) {
              return "";
            }

            return `
              <div class="friend-request-card outgoing">
                ${this.renderFriendAvatar(user)}

                <div class="friend-request-info">
                  <strong>${escapeHTML(user.username)}</strong>
                  <span>Заявка отправлена</span>
                </div>

                <button
                  class="friend-request-cancel"
                  type="button"
                  data-cancel-request="${request.id}"
                  title="Отменить заявку"
                >
                  Отмена
                </button>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  renderFriends() {
    if (this.friends.length === 0) {
      return `
        <div class="empty-state">
          <p>Пока друзей нет.</p>
          <span>Отправь заявку по нику.</span>
        </div>
      `;
    }

    return this.friends
      .map((friend) => {
        const isActive = friend.id === this.currentFriendId ? "active" : "";

        const unreadCount = this.notificationService.getUnreadDialogCount(
          this.currentUser.id,
          friend.id
        );

        return `
          <button class="friend-item ${isActive}" data-friend-id="${friend.id}">
            ${this.renderFriendAvatar(friend)}

            <span class="friend-info">
              <strong>${escapeHTML(friend.username)}</strong>
              <small>${escapeHTML(friend.status || "online")}</small>
            </span>

            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ""}

            <span
              class="friend-block"
              data-block-friend="${friend.id}"
              title="Заблокировать"
            >
              ⛔
            </span>

            <span
              class="friend-remove"
              data-remove-friend="${friend.id}"
              title="Удалить друга"
            >
              ×
            </span>
          </button>
        `;
      })
      .join("");
  }
}