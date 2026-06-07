import { Component } from "./Component.js";
import { escapeHTML, renderAvatar } from "../utils/helpers.js";

export class FriendList extends Component {
  constructor({
    friends,
    currentFriendId,
    onSelectFriend,
    onAddFriend,
    onRemoveFriend,
    onBackToServers,
    currentUser,
    notificationService
  }) {
    super();

    this.friends = friends;
    this.currentUser = currentUser;
    this.notificationService = notificationService;
    this.currentFriendId = currentFriendId;
    this.onSelectFriend = onSelectFriend;
    this.onAddFriend = onAddFriend;
    this.onRemoveFriend = onRemoveFriend;
    this.onBackToServers = onBackToServers;
  }

  render() {
    this.element = this.createElement(`
      <aside class="channel-sidebar">
        <header class="server-header">
          <div>
            <h2>Личные сообщения</h2>
            <span>${this.friends.length} друзей</span>
          </div>

          <button id="backToServersButton" class="icon-button" title="К серверам">
            ↩
          </button>
        </header>

        <section class="channels-section">
          <div class="section-title">
            <span>Друзья</span>

            <button id="addFriendButton" title="Добавить друга">
              +
            </button>
          </div>

          <div class="friend-list">
            ${this.renderFriends()}
          </div>
        </section>
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
  }

  renderFriends() {
    if (this.friends.length === 0) {
      return `
        <div class="friends-empty">
          <p>Пока друзей нет.</p>
          <span>Добавь друга по нику.</span>
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
  <div class="friend-row ${isActive}" data-friend-id="${friend.id}">
    <button class="friend-button">
      <div class="friend-avatar">${renderAvatar(friend.avatar, "?")}</div>

      <div class="friend-info">
        <strong>${escapeHTML(friend.username)}</strong>
        <span>${escapeHTML(friend.status || "online")}</span>
      </div>

      ${unreadCount > 0 ? `<span class="friend-unread-badge">${unreadCount}</span>` : ""}
    </button>

    <button 
      class="friend-remove-button" 
      data-remove-friend="${friend.id}"
      title="Удалить друга"
    >
      ×
    </button>
  </div>
`;
      })
      .join("");
  }
}