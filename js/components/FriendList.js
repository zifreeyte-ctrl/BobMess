import { Component } from "./Component.js";
import { escapeHTML } from "../utils/helpers.js";

export class FriendList extends Component {
  constructor({
    friends,
    currentFriendId,
    onSelectFriend,
    onAddFriend,
    onRemoveFriend,
    onBlockFriend,
    onOpenFriendProfile,
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
    this.onOpenFriendProfile = onOpenFriendProfile;
    this.onBackToServers = onBackToServers;

    this.userService = userService;
    this.incomingRequests = incomingRequests;
    this.outgoingRequests = outgoingRequests;
    this.onAcceptFriendRequest = onAcceptFriendRequest;
    this.onRejectFriendRequest = onRejectFriendRequest;
    this.onCancelFriendRequest = onCancelFriendRequest;

    this.friendSearchQuery = "";
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

          <div class="friend-search-box">
            <input
              id="friendSearchInput"
              type="text"
              placeholder="Поиск друзей..."
              autocomplete="off"
            />

            <button
              id="clearFriendSearchButton"
              type="button"
              title="Очистить поиск"
              hidden
            >
              ×
            </button>
          </div>

          ${this.renderFriendRequests()}

          <div class="friends-list" id="friendsListSlot">
            ${this.renderFriends()}
          </div>
        </div>
      </aside>
    `);

    return this.element;
  }

  afterRender() {
    const addFriendButton = this.element.querySelector("#addFriendButton");
    const backToServersButton = this.element.querySelector("#backToServersButton");
    const friendSearchInput = this.element.querySelector("#friendSearchInput");
    const clearFriendSearchButton = this.element.querySelector("#clearFriendSearchButton");

    addFriendButton.addEventListener("click", () => {
      this.onAddFriend();
    });

    backToServersButton.addEventListener("click", () => {
      this.onBackToServers();
    });

    friendSearchInput.addEventListener("input", () => {
      this.friendSearchQuery = friendSearchInput.value.trim().toLowerCase();

      clearFriendSearchButton.hidden = this.friendSearchQuery.length === 0;

      this.updateFriendsList();
    });

    clearFriendSearchButton.addEventListener("click", () => {
      friendSearchInput.value = "";
      this.friendSearchQuery = "";
      clearFriendSearchButton.hidden = true;

      this.updateFriendsList();
      friendSearchInput.focus();
    });

    this.bindFriendEvents();
    this.bindRequestEvents();
  }

  bindFriendEvents() {
    this.element.querySelectorAll("[data-friend-id]").forEach((item) => {
      item.addEventListener("click", () => {
        this.onSelectFriend(item.dataset.friendId);
      });
    });

    this.element.querySelectorAll("[data-open-friend-profile]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (this.onOpenFriendProfile) {
          this.onOpenFriendProfile(button.dataset.openFriendProfile);
        }
      });
    });

    this.element.querySelectorAll("[data-block-friend]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (this.onBlockFriend) {
          this.onBlockFriend(button.dataset.blockFriend);
        }
      });
    });

    this.element.querySelectorAll("[data-remove-friend]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        this.onRemoveFriend(button.dataset.removeFriend);
      });
    });
  }

  bindRequestEvents() {
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

  updateFriendsList() {
    const friendsListSlot = this.element.querySelector("#friendsListSlot");

    if (!friendsListSlot) {
      return;
    }

    friendsListSlot.innerHTML = this.renderFriends();

    this.bindFriendEvents();
  }

  getFilteredFriends() {
    if (!this.friendSearchQuery) {
      return this.friends;
    }

    return this.friends.filter((friend) => {
      const username = friend.username || "";
      const status = friend.status || "";

      return (
        username.toLowerCase().includes(this.friendSearchQuery) ||
        status.toLowerCase().includes(this.friendSearchQuery)
      );
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
        <div class="friend-request-title">
          <span>Входящие заявки</span>
          <span class="friend-request-small-badge">${this.incomingRequests.length}</span>
        </div>

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
        <div class="friend-request-title">
          <span>Исходящие заявки</span>
          <span class="friend-request-small-badge muted">${this.outgoingRequests.length}</span>
        </div>

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
        <div class="empty-state dm-empty-state">
          <p>Пока друзей нет.</p>
          <span>Нажми на плюс и отправь заявку по нику пользователя.</span>
        </div>
      `;
    }

    const filteredFriends = this.getFilteredFriends();

    if (filteredFriends.length === 0) {
      return `
        <div class="empty-state dm-empty-state">
          <p>Ничего не найдено.</p>
          <span>Попробуй другой ник или очисти поиск.</span>
        </div>
      `;
    }

    return filteredFriends
      .map((friend) => {
        const isActive = friend.id === this.currentFriendId ? "active" : "";

        const unreadCount = this.notificationService.getUnreadDialogCount(
          this.currentUser.id,
          friend.id
        );

        return `
          <div class="friend-item ${isActive}" data-friend-id="${friend.id}">
            ${this.renderFriendAvatar(friend)}

            <span class="friend-info">
              <strong>${escapeHTML(friend.username)}</strong>
              <small>${escapeHTML(friend.status || "online")}</small>
            </span>

            ${unreadCount > 0 ? `<span class="unread-badge friend-unread-badge">${unreadCount}</span>` : ""}

            <div class="friend-actions">
              <button
                class="friend-action friend-profile"
                type="button"
                data-open-friend-profile="${friend.id}"
                title="Профиль"
              >
                👤
              </button>

              <button
                class="friend-action friend-block"
                type="button"
                data-block-friend="${friend.id}"
                title="Заблокировать"
              >
                ⛔
              </button>

              <button
                class="friend-action friend-remove"
                type="button"
                data-remove-friend="${friend.id}"
                title="Удалить друга"
              >
                ×
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }
}