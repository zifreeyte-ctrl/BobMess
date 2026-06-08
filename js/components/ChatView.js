import { Component } from "./Component.js";
import { ServerList } from "./ServerList.js";
import { ChannelList } from "./ChannelList.js";
import { MessageList } from "./MessageList.js";
import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";
import { ProfileModal } from "./ProfileModal.js";
import { FriendList } from "./FriendList.js";
import { DirectMessageView } from "./DirectMessageView.js";
import { escapeHTML, readFileAsDataUrl, renderAvatar } from "../utils/helpers.js";
import { ServerMembersPanel } from "./ServerMembersPanel.js";
import { PublicProfileModal } from "./PublicProfileModal.js";
import { DevToolsModal } from "./DevToolsModal.js";


export class ChatView extends Component {
  constructor({
    storage,
    authService,
    userService,
    friendService,
    directMessageService,
    notificationService,
    searchService,
    roleService,
    inviteLinkService,
    serverService,
    chatService,
    themeService,
    eventBus
}) {
    super();

    this.authService = authService;
    this.storage = storage;
    this.userService = userService;
    this.friendService = friendService;
    this.directMessageService = directMessageService;
    this.notificationService = notificationService;
    this.searchService = searchService;
    this.roleService = roleService;
    this.inviteLinkService = inviteLinkService;
    this.inviteFromUrlHandled = false;
    this.serverService = serverService;
    this.chatService = chatService;
    this.themeService = themeService;
    this.eventBus = eventBus;

    this.currentServerId = null;
    this.currentChannelId = null;
    this.currentFriendId = null;
    this.channelSearchResults = null;
    this.dmSearchResults = null;

    this.mode = "server";

    this.serverList = null;
    this.channelList = null;
    this.messageListComponent = null;
    this.friendList = null;
    this.directMessageView = null;
  }

  render() {
    const currentUser = this.authService.getCurrentUser();
    const servers = this.serverService.getServersForUser(currentUser.id);
    const friends = this.friendService.getFriendsForUser(currentUser.id);

    this.currentServerId = this.currentServerId || servers[0]?.id || null;

    this.serverList = new ServerList({
        servers,
        currentServerId: this.currentServerId,
        mode: this.mode,
        currentUser,
        friends,
        notificationService: this.notificationService,
        onSelectServer: (serverId) => this.selectServer(serverId),
        onCreateServer: () => this.openCreateServerModal(),
        onOpenDirectMessages: () => this.openDirectMessages()
    });

    if (this.mode === "dm") {
      return this.renderDirectMessages(currentUser);
    }

    return this.renderServerChat(currentUser, servers);
  }

  renderDirectMessages(currentUser) {
    const friends = this.friendService.getFriendsForUser(currentUser.id);

    if (!this.currentFriendId && friends.length > 0) {
      this.currentFriendId = friends[0].id;
    }

    const currentFriend =
      friends.find((friend) => friend.id === this.currentFriendId) || null;

    const dmMessages = currentFriend
      ? this.directMessageService.getDialogMessages(currentUser.id, currentFriend.id)
      : [];

    this.friendList = new FriendList({
        friends,
        currentUser,
        currentFriendId: this.currentFriendId,
        notificationService: this.notificationService,
        onSelectFriend: (friendId) => this.selectFriend(friendId),
        onAddFriend: () => this.openAddFriendModal(),
        onRemoveFriend: (friendId) => this.openRemoveFriendModal(friendId),
        onBackToServers: () => this.backToServers()
    });
    if (currentFriend) {
        this.notificationService.markDialogAsRead(currentUser.id, currentFriend.id);
    }

    this.directMessageView = new DirectMessageView({
      currentUser,
      friend: currentFriend,
      messages: dmMessages,
      searchResults: this.dmSearchResults,
      userService: this.userService,
      onSendMessage: (text) => this.sendDirectMessage(text),
      onSearch: (query) => this.searchDirectMessages(query),
      onClearSearch: () => this.clearDirectMessageSearch(),
      onEditMessage: (messageId) => this.openEditDirectMessageModal(messageId),
      onDeleteMessage: (messageId) => this.openDeleteDirectMessageModal(messageId),
      onOpenUserProfile: (userId) => this.openUserProfileModal(userId)
    });

    this.element = this.createElement(`
      <main class="bob-layout">
        <div id="serverListSlot"></div>
        <div id="friendListSlot"></div>
        <div id="directMessageSlot"></div>
      </main>
    `);

    this.element.querySelector("#serverListSlot").replaceWith(this.serverList.render());
    this.element.querySelector("#friendListSlot").replaceWith(this.friendList.render());
    this.element.querySelector("#directMessageSlot").replaceWith(this.directMessageView.render());

    return this.element;
  }

  renderServerChat(currentUser, servers) {
    const currentServer = this.serverService.getServerById(this.currentServerId);

    if (!currentServer) {
      this.element = this.createElement(`
        <main class="bob-layout">
          <div id="serverListSlot"></div>

          <section class="chat-panel">
            <div class="empty-chat">
              <div class="empty-chat-icon">🧱</div>
              <h2>Нет серверов</h2>
              <p>Создай первый сервер, чтобы начать пользоваться BOB.</p>
              <button class="empty-action-button" id="createFirstServerButton">
                Создать сервер
              </button>
            </div>
          </section>
        </main>
      `);

      this.element.querySelector("#serverListSlot").replaceWith(this.serverList.render());

      return this.element;
    }

    this.currentChannelId =
      this.currentChannelId || currentServer.channels[0]?.id || null;

      const visibleChannels = currentServer.channels.filter((channel) => {
        return this.roleService.canViewChannel(
          currentServer.id,
          channel,
          currentUser.id
        );
      });

      if (
        this.currentChannelId &&
        !visibleChannels.some((channel) => channel.id === this.currentChannelId)
      ) {
        this.currentChannelId = visibleChannels[0]?.id || null;
      }

      if (!this.currentChannelId && visibleChannels.length > 0) {
        this.currentChannelId = visibleChannels[0].id;
      }

      const serverForView = {
        ...currentServer,
        channels: visibleChannels
      };

    const currentChannel = this.getCurrentChannel();

    const canManageServer = this.roleService.hasPermission(
  currentServer.id,
  currentUser.id,
  "manageServer"
);

const canManageChannels = this.roleService.hasPermission(
  currentServer.id,
  currentUser.id,
  "manageChannels"
);

const canSendMessages = this.roleService.hasPermission(
  currentServer.id,
  currentUser.id,
  "sendMessages"
);

    this.channelList = new ChannelList({
      server: serverForView,
      currentChannelId: this.currentChannelId,
      currentUser,
      notificationService: this.notificationService,
      canManageServer,
      canManageChannels,
      onSelectChannel: (channelId) => this.selectChannel(channelId),
      onCreateChannel: () => this.openCreateChannelModal(),
      onRenameChannel: (channelId) => this.openRenameChannelModal(channelId),
      onDeleteChannel: (channelId) => this.openDeleteChannelModal(channelId),
      onOpenSettings: () => this.openServerSettingsModal(),
      onOpenProfile: () => this.openProfileModal(),
      onToggleTheme: () => this.themeService.toggleTheme(),
      onLogout: () => this.logout()
    });

    const messages = this.currentChannelId
      ? this.chatService.getMessagesByChannel(this.currentChannelId)
      : [];
    if (this.currentChannelId) {
        this.notificationService.markChannelAsRead(currentUser.id, this.currentChannelId);
    }

    this.messageListComponent = new MessageList({
      messages,
      searchResults: this.channelSearchResults,
      authService: this.authService,
      currentUser,
      onDeleteMessage: (messageId) => this.deleteMessage(messageId),
      onEditMessage: (messageId) => this.openEditMessageModal(messageId),
      onOpenUserProfile: (userId) => this.openUserProfileModal(userId)
    });

    this.element = this.createElement(`
      <main class="bob-layout">
        <div id="serverListSlot"></div>
        <div id="channelListSlot"></div>

        <section class="chat-panel">
          <header class="chat-header chat-header-with-search">
            <div>
                <h1>${escapeHTML(currentChannel ? `# ${currentChannel.name}` : "# unknown")}</h1>
                <p>${escapeHTML(currentServer.name)} · BOB communication</p>
            </div>

            <form class="chat-search-form" id="channelSearchForm">
                <input
                id="channelSearchInput"
                type="text"
                placeholder="Поиск в канале..."
                ${this.currentChannelId ? "" : "disabled"}
                />

                <button type="submit" ${this.currentChannelId ? "" : "disabled"}>🔎</button>
                <button type="button" id="channelClearSearchButton">×</button>
            </form>
        </header>

          <div id="messageListSlot"></div>

          <form class="message-form" id="messageForm">
            <input
              id="messageInput"
              type="text"
              placeholder="Написать сообщение..."
              autocomplete="off"
              ${this.currentChannelId && canSendMessages ? "" : "disabled"}
            />

            <button type="submit" ${this.currentChannelId && canSendMessages ? "" : "disabled"}>
              Отправить
            </button>
          </form>
        </section>
      </main>
    `);

    this.element.querySelector("#serverListSlot").replaceWith(this.serverList.render());
    this.element.querySelector("#channelListSlot").replaceWith(this.channelList.render());
    this.element.querySelector("#messageListSlot").replaceWith(this.messageListComponent.render());

    return this.element;
  }

  afterRender() {
    setTimeout(() => {
      this.handleInviteFromUrl();
    }, 100);

    this.serverList?.afterRender();

    if (this.mode === "dm") {
      this.friendList?.afterRender();
      this.directMessageView?.afterRender();
      return;
    }

    if (!this.channelList) {
      const createFirstServerButton = this.element.querySelector("#createFirstServerButton");

      if (createFirstServerButton) {
        createFirstServerButton.addEventListener("click", () => {
          this.openCreateServerModal();
        });
      }

      if (!this.inviteFromUrlHandled) {
      this.handleInviteFromUrl();
      }

      return;
    }

    this.channelList.afterRender();
    this.messageListComponent.afterRender();

    this.messageForm = this.element.querySelector("#messageForm");
    this.messageInput = this.element.querySelector("#messageInput");

    this.messageForm.addEventListener("submit", (event) => {
      this.handleSendMessage(event);
    });
    const searchForm = this.element.querySelector("#channelSearchForm");
    const clearSearchButton = this.element.querySelector("#channelClearSearchButton");

    if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const input = this.element.querySelector("#channelSearchInput");
        this.searchChannelMessages(input.value);
    });
    }

    if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
        this.clearChannelSearch();
    });
    }
  }

  selectServer(serverId) {
    this.mode = "server";
    this.currentServerId = serverId;
    this.channelSearchResults = null;
    this.dmSearchResults = null;

    const server = this.serverService.getServerById(serverId);
    this.currentChannelId = server?.channels[0]?.id || null;

    this.refresh();
  }

  selectChannel(channelId) {
    this.currentChannelId = channelId;
    this.channelSearchResults = null;
    this.refresh();
}

  handleSendMessage(event) {
    event.preventDefault();

    const currentUser = this.authService.getCurrentUser();
    const input = event.target.querySelector("#messageInput");
    const text = input.value.trim();

    try {
      if (!this.roleService.hasPermission(this.currentServerId, currentUser.id, "sendMessages")) {
      throw new Error("У тебя нет права отправлять сообщения.");
    }
      this.chatService.sendMessage(this.currentChannelId, currentUser.id, text);
      input.value = "";
      this.refresh();
    } catch (error) {
      Toast.show(error.message, "error");
    }
  }

  openDirectMessages() {
    this.mode = "dm";
    this.channelSearchResults = null;
    this.refresh();
}

  backToServers() {
    this.mode = "server";
    this.refresh();
  }

  selectFriend(friendId) {
    this.currentFriendId = friendId;
    this.dmSearchResults = null;
    this.refresh();
}

  openAddFriendModal() {
    const modal = new Modal({
      title: "Добавить друга",
      confirmText: "Добавить",
      content: `
        <div class="form-group">
          <label>Ник пользователя</label>
          <input id="friendUsernameInput" type="text" placeholder="Например: Alex" />
        </div>
      `,
      onConfirm: (modalElement) => {
        const input = modalElement.querySelector("#friendUsernameInput");
        const username = input.value.trim();
        const user = this.authService.getCurrentUser();

        try {
          const friend = this.friendService.addFriendByUsername(user.id, username);

          this.currentFriendId = friend.id;

          Toast.show("Друг добавлен.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

openCreateServerModal() {
  const modal = new Modal({
    title: "Новый сервер",
    confirmText: "Создать",
    content: `
      <div class="form-group">
        <label>Название нового сервера</label>
        <input 
          id="serverNameInput" 
          type="text" 
          placeholder="Например: BOB Community" 
        />
      </div>

      <div class="modal-splitter">
        или
      </div>

      <button class="settings-action" id="joinByInviteButton" type="button">
        Войти по invite-коду
      </button>
    `,
    onConfirm: (modalElement) => {
      const input = modalElement.querySelector("#serverNameInput");
      const serverName = input.value.trim();

      if (!serverName) {
        input.focus();
        return;
      }

      const user = this.authService.getCurrentUser();

      try {
        const server = this.serverService.createServer(serverName, user.id);
        const updatedServer = this.serverService.getServerById(server.id);

        this.mode = "server";
        this.currentServerId = updatedServer.id;
        this.currentChannelId = updatedServer.channels[0]?.id || null;

        Toast.show("Сервер создан.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    }
  });

  modal.open();

  modal.element
    .querySelector("#joinByInviteButton")
    .addEventListener("click", () => {
      modal.close();
      this.openJoinServerModal();
    });
  }

  openDevToolsModal() {
  const modal = new DevToolsModal({
    storage: this.storage,
    onReset: () => {
      this.logout();
    }
  });

  modal.open();
}

  openRemoveFriendModal(friendId) {
    const friend = this.userService.getUserById(friendId);

    if (!friend) return;

    const modal = new Modal({
      title: "Удалить друга",
      confirmText: "Удалить",
      content: `
        <div class="confirm-box">
          <h3>Удалить ${escapeHTML(friend.username)} из друзей?</h3>
          <p>Личная переписка с этим пользователем тоже будет удалена.</p>
        </div>
      `,
      onConfirm: () => {
        const user = this.authService.getCurrentUser();

        try {
          this.friendService.removeFriend(user.id, friendId);

          const friends = this.friendService.getFriendsForUser(user.id);
          this.currentFriendId = friends[0]?.id || null;

          Toast.show("Друг удалён.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  sendDirectMessage(text) {
    const user = this.authService.getCurrentUser();

    try {
      this.directMessageService.sendMessage(user.id, this.currentFriendId, text);
      this.refresh();
    } catch (error) {
      Toast.show(error.message, "error");
    }
  }

  openEditDirectMessageModal(messageId) {
    const user = this.authService.getCurrentUser();

    const messages = this.directMessageService.getDialogMessages(
      user.id,
      this.currentFriendId
    );

    const message = messages.find((item) => item.id === messageId);

    if (!message) return;

    const modal = new Modal({
      title: "Редактировать личное сообщение",
      confirmText: "Сохранить",
      content: `
        <div class="form-group">
          <label>Текст сообщения</label>
          <input id="dmEditInput" type="text" value="${escapeHTML(message.text)}" />
        </div>
      `,
      onConfirm: (modalElement) => {
        const input = modalElement.querySelector("#dmEditInput");
        const newText = input.value.trim();

        try {
          this.directMessageService.editMessage(messageId, user.id, newText);
          Toast.show("Сообщение изменено.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  openDeleteDirectMessageModal(messageId) {
    const modal = new Modal({
      title: "Удалить личное сообщение",
      confirmText: "Удалить",
      content: `
        <div class="confirm-box">
          <h3>Удалить это сообщение?</h3>
          <p>Это действие нельзя отменить.</p>
        </div>
      `,
      onConfirm: () => {
        const user = this.authService.getCurrentUser();

        try {
          this.directMessageService.deleteMessage(messageId, user.id);
          Toast.show("Сообщение удалено.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  handleInviteFromUrl() {
  const inviteCode = this.inviteLinkService.getInviteCodeFromUrl();

  if (!inviteCode) {
    return;
  }

  this.openJoinServerModal(inviteCode);
}

  openCreateInviteModal() {
  const user = this.authService.getCurrentUser();

  if (!this.roleService.hasPermission(this.currentServerId, user.id, "createInvites")) {
    Toast.show("У тебя нет права создавать инвайты.", "error");
    return;
  }

  try {
    const inviteCode = this.serverService.createInvite(
      this.currentServerId,
      user.id
    );

    const inviteLink = this.inviteLinkService.createInviteLink(inviteCode);

    const modal = new Modal({
      title: "Invite-ссылка создана",
      confirmText: "Закрыть",
      content: `
        <div class="invite-box">
          <p>Код приглашения:</p>

          <div class="invite-code">
            ${escapeHTML(inviteCode)}
          </div>

          <p>Полная invite-ссылка:</p>

          <div class="invite-link-box">
            <input 
              id="inviteLinkInput" 
              type="text" 
              value="${escapeHTML(inviteLink)}" 
              readonly 
            />

            <button id="copyInviteLinkButton" type="button">
              Копировать
            </button>
          </div>

          <p class="muted-text">
            Друг открывает эту ссылку, входит в аккаунт, и BobMess предложит вступить на сервер.
          </p>
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();

    modal.element
      .querySelector("#copyInviteLinkButton")
      .addEventListener("click", async () => {
        try {
          await this.inviteLinkService.copyToClipboard(inviteLink);
          Toast.show("Invite-ссылка скопирована.");
        } catch (error) {
          const input = modal.element.querySelector("#inviteLinkInput");
          input.select();
          document.execCommand("copy");
          Toast.show("Invite-ссылка скопирована.");
        }
      });
  } catch (error) {
    Toast.show(error.message, "error");
  }
}

  openCreateChannelModal() {
  const user = this.authService.getCurrentUser();

  if (!this.roleService.hasPermission(this.currentServerId, user.id, "createChannels")) {
    Toast.show("У тебя нет права создавать каналы.", "error");
    return;
  }

  const modal = new Modal({
    title: "Создать канал",
    confirmText: "Создать",
    content: `
      <div class="form-group">
        <label>Название канала</label>
        <input id="channelNameInput" type="text" placeholder="Например: private-chat" />
      </div>

      <label class="checkbox-row">
        <input id="channelPrivateInput" type="checkbox" />
        <span>Сделать канал приватным</span>
      </label>

      <p class="muted-text">
        Приватный канал будет виден только тебе, владельцу сервера и тем, кому позже дадут доступ.
      </p>
    `,
    onConfirm: (modalElement) => {
      const input = modalElement.querySelector("#channelNameInput");
      const privateInput = modalElement.querySelector("#channelPrivateInput");

      const channelName = input.value.trim();
      const isPrivate = privateInput.checked;

      if (!channelName) {
        input.focus();
        return;
      }

      try {
        const channel = this.serverService.createChannel(
          this.currentServerId,
          channelName,
          user.id,
          {
            isPrivate,
            allowedMembers: [],
            allowedRoles: []
          }
        );

        this.currentChannelId = channel.id;

        Toast.show(isPrivate ? "Приватный канал создан." : "Канал создан.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    }
  });

  modal.open();
}

  openUserProfileModal(userId) {
  const user = this.userService.getUserById(userId);

  if (!user) {
    Toast.show("Пользователь не найден.", "error");
    return;
  }

  const profileModal = new PublicProfileModal({
    user
  });

  profileModal.open();
}

  openServerSettingsModal() {
  const server = this.serverService.getServerById(this.currentServerId);
  const currentUser = this.authService.getCurrentUser();
  const users = this.userService.getUsers();

  if (!server) {
    return;
  }

  const membersPanel = new ServerMembersPanel({
    server,
    users,
    currentUser,
    roleService: this.roleService,
    onAssignRole: (userId, roleId) => {
      try {
        this.roleService.assignRole(
          this.currentServerId,
          userId,
          roleId,
          currentUser.id
        );

        Toast.show("Роль выдана.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    },
    onRemoveRole: (userId, roleId) => {
      try {
        this.roleService.removeRole(
          this.currentServerId,
          userId,
          roleId,
          currentUser.id
        );

        Toast.show("Роль снята.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    }
  });

  const modal = new Modal({
    title: "Настройки сервера",
    confirmText: "Закрыть",
    content: `
      <div class="settings-box">
        <div class="settings-row">
          <div>
            <strong>${escapeHTML(server.name)}</strong>
            <p class="muted-text">Управление сервером BOB</p>
          </div>
        </div>

        <div class="server-icon-editor">
          <div class="server-icon-preview" id="serverIconPreview">
            ${renderAvatar(server.icon, "S")}
          </div>

          <div class="server-icon-actions">
            <p class="muted-text">Иконка сервера</p>
            <input id="serverIconFileInput" type="file" accept="image/*" />
          </div>
        </div>

        <button class="settings-action" id="renameServerButton">
          Переименовать сервер
        </button>

        <button class="settings-action" id="createInviteButton">
          Создать invite-ссылку
        </button>

        ${membersPanel.render()}

        <button class="settings-action danger" id="deleteServerButton">
          Удалить сервер
        </button>
      </div>
    `,
    onConfirm: () => {
      modal.close();
    }
  });

  modal.open();

  membersPanel.bindEvents(modal.element);

  const iconFileInput = modal.element.querySelector("#serverIconFileInput");
  const iconPreview = modal.element.querySelector("#serverIconPreview");

  if (iconFileInput) {
    iconFileInput.addEventListener("change", async () => {
      const file = iconFileInput.files[0];

      if (!file) {
        return;
      }

      try {
        const imageData = await readFileAsDataUrl(file);
        const user = this.authService.getCurrentUser();

        this.serverService.updateServerIcon(
          this.currentServerId,
          user.id,
          imageData
        );

        iconPreview.innerHTML = `<img src="${imageData}" alt="server icon" />`;

        Toast.show("Иконка сервера обновлена.");
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    });
  }

  modal.element
    .querySelector("#renameServerButton")
    .addEventListener("click", () => {
      modal.close();
      this.openRenameServerModal();
    });

  modal.element
    .querySelector("#createInviteButton")
    .addEventListener("click", () => {
      modal.close();
      this.openCreateInviteModal();
    });

  modal.element
    .querySelector("#deleteServerButton")
    .addEventListener("click", () => {
      modal.close();
      this.openDeleteServerModal();
    });
}

  openRenameServerModal() {
    const server = this.serverService.getServerById(this.currentServerId);

    if (!server) return;

    const modal = new Modal({
      title: "Переименовать сервер",
      confirmText: "Сохранить",
      content: `
        <div class="form-group">
          <label>Новое название сервера</label>
          <input id="serverRenameInput" type="text" value="${escapeHTML(server.name)}" />
        </div>
      `,
      onConfirm: (modalElement) => {
        const input = modalElement.querySelector("#serverRenameInput");
        const newName = input.value.trim();
        const user = this.authService.getCurrentUser();

        try {
          this.serverService.renameServer(this.currentServerId, newName, user.id);
          Toast.show("Сервер переименован.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  openDeleteServerModal() {
    const server = this.serverService.getServerById(this.currentServerId);

    if (!server) return;

    const modal = new Modal({
      title: "Удалить сервер",
      confirmText: "Удалить",
      content: `
        <div class="confirm-box">
          <h3>Удалить сервер?</h3>
          <p>
            Сервер <strong>${escapeHTML(server.name)}</strong>, все его каналы 
            и сообщения будут удалены навсегда.
          </p>
        </div>
      `,
      onConfirm: () => {
        const user = this.authService.getCurrentUser();

        try {
          this.serverService.deleteServer(this.currentServerId, user.id);

          const servers = this.serverService.getServers();
          this.currentServerId = servers[0]?.id || null;
          this.currentChannelId = servers[0]?.channels[0]?.id || null;

          Toast.show("Сервер удалён.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  openRenameChannelModal(channelId) {
  const user = this.authService.getCurrentUser();
  const server = this.serverService.getServerById(this.currentServerId);
  const channel = server?.channels.find((item) => item.id === channelId);

  if (!channel) {
    return;
  }

  if (!this.roleService.canManageChannel(this.currentServerId, channel, user.id)) {
    Toast.show("Ты можешь менять только свои каналы.", "error");
    return;
  }

  const members = this.userService
    .getUsers()
    .filter((item) => server.members?.includes(item.id));

  const roles = this.roleService.getAssignableRoles(this.currentServerId);

  const modal = new Modal({
    title: "Настройки канала",
    confirmText: "Сохранить",
    content: `
      <div class="form-group">
        <label>Название канала</label>
        <input 
          id="channelRenameInput" 
          type="text" 
          value="${escapeHTML(channel.name)}" 
        />
      </div>

      <label class="checkbox-row">
        <input 
          id="channelPrivateInput" 
          type="checkbox" 
          ${channel.isPrivate ? "checked" : ""}
        />
        <span>Приватный канал</span>
      </label>

      <div class="channel-access-box">
        <h3>Доступ по участникам</h3>

        <div class="access-list">
          ${members
            .filter((member) => member.id !== channel.ownerId)
            .map((member) => {
              const checked = channel.allowedMembers?.includes(member.id)
                ? "checked"
                : "";

              return `
                <label class="access-row">
                  <input 
                    type="checkbox" 
                    data-access-member="${member.id}" 
                    ${checked}
                  />

                  <span>${renderAvatar(member.avatar, "?")}</span>
                  <strong>${escapeHTML(member.username)}</strong>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="channel-access-box">
        <h3>Доступ по ролям</h3>

        <div class="access-list">
          ${roles
            .map((role) => {
              const checked = channel.allowedRoles?.includes(role.id)
                ? "checked"
                : "";

              return `
                <label class="access-row">
                  <input 
                    type="checkbox" 
                    data-access-role="${role.id}" 
                    ${checked}
                  />

                  <span class="role-color-dot" style="background:${escapeHTML(role.color)}"></span>
                  <strong>${escapeHTML(role.name)}</strong>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
    `,
    onConfirm: (modalElement) => {
      const nameInput = modalElement.querySelector("#channelRenameInput");
      const privateInput = modalElement.querySelector("#channelPrivateInput");

      const allowedMembers = Array.from(
        modalElement.querySelectorAll("[data-access-member]:checked")
      ).map((input) => input.dataset.accessMember);

      const allowedRoles = Array.from(
        modalElement.querySelectorAll("[data-access-role]:checked")
      ).map((input) => input.dataset.accessRole);

      try {
        this.serverService.updateChannelSettings(
          this.currentServerId,
          channelId,
          {
            name: nameInput.value.trim(),
            isPrivate: privateInput.checked,
            allowedMembers,
            allowedRoles
          }
        );

        Toast.show("Настройки канала сохранены.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    }
  });

  modal.open();
} 

  openDeleteChannelModal(channelId) {
    const user = this.authService.getCurrentUser();
    const server = this.serverService.getServerById(this.currentServerId);
    const channel = server?.channels.find((item) => item.id === channelId);

    if (!this.roleService.canManageChannel(this.currentServerId, channel, user.id)) {
      Toast.show("Ты можешь удалять только свои каналы.", "error");
      return;
    }

    if (!channel) return;

    const modal = new Modal({
      title: "Удалить канал",
      confirmText: "Удалить",
      content: `
        <div class="confirm-box">
          <h3>Удалить канал #${escapeHTML(channel.name)}?</h3>
          <p>Все сообщения из этого канала будут удалены.</p>
        </div>
      `,
      onConfirm: () => {
        try {
          this.serverService.deleteChannel(this.currentServerId, channelId);

          const updatedServer = this.serverService.getServerById(this.currentServerId);

          if (this.currentChannelId === channelId) {
            this.currentChannelId = updatedServer.channels[0]?.id || null;
          }

          Toast.show("Канал удалён.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  openJoinServerModal(prefilledCode = "") {
  const modal = new Modal({
    title: "Войти на сервер",
    confirmText: "Войти",
    content: `
      <div class="form-group">
        <label>Invite-код</label>
        <input 
          id="inviteCodeInput" 
          type="text" 
          placeholder="Например: bob-a1b2c3"
          value="${escapeHTML(prefilledCode)}"
        />
      </div>
    `,
    onConfirm: (modalElement) => {
      const input = modalElement.querySelector("#inviteCodeInput");
      const inviteCode = input.value.trim();
      const user = this.authService.getCurrentUser();

      try {
        const server = this.serverService.joinServerByInvite(inviteCode, user.id);

        this.mode = "server";
        this.currentServerId = server.id;
        this.currentChannelId = server.channels[0]?.id || null;

        this.inviteLinkService.clearInviteFromUrl();

        Toast.show("Ты вошёл на сервер.");
        modal.close();
        this.refresh();
      } catch (error) {
        Toast.show(error.message, "error");
      }
    }
  });

  modal.open();
}

  openEditMessageModal(messageId) {
    const messages = this.chatService.getMessagesByChannel(this.currentChannelId);
    const message = messages.find((item) => item.id === messageId);

    if (!message) return;

    const modal = new Modal({
      title: "Редактировать сообщение",
      confirmText: "Сохранить",
      content: `
        <div class="form-group">
          <label>Текст сообщения</label>
          <input id="messageEditInput" type="text" value="${escapeHTML(message.text)}" />
        </div>
      `,
      onConfirm: (modalElement) => {
        const input = modalElement.querySelector("#messageEditInput");
        const newText = input.value.trim();
        const user = this.authService.getCurrentUser();

        try {
          this.chatService.editMessage(messageId, user.id, newText);
          Toast.show("Сообщение изменено.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  deleteMessage(messageId) {
    const modal = new Modal({
      title: "Удалить сообщение",
      confirmText: "Удалить",
      content: `
        <div class="confirm-box">
          <h3>Удалить это сообщение?</h3>
          <p>Это действие нельзя будет отменить.</p>
        </div>
      `,
      onConfirm: () => {
        const user = this.authService.getCurrentUser();

        try {
          this.chatService.deleteMessage(messageId, user.id);
          Toast.show("Сообщение удалено.");
          modal.close();
          this.refresh();
        } catch (error) {
          Toast.show(error.message, "error");
        }
      }
    });

    modal.open();
  }

  searchChannelMessages(query) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    this.channelSearchResults = null;
    this.refresh();
    return;
  }

  this.channelSearchResults = this.searchService.searchChannelMessages(
    this.currentChannelId,
    cleanQuery
  );

  this.refresh();
}

clearChannelSearch() {
  this.channelSearchResults = null;
  this.refresh();
}

searchDirectMessages(query) {
  const cleanQuery = query.trim();
  const user = this.authService.getCurrentUser();

  if (!cleanQuery) {
    this.dmSearchResults = null;
    this.refresh();
    return;
  }

  this.dmSearchResults = this.searchService.searchDirectMessages(
    user.id,
    this.currentFriendId,
    cleanQuery
  );

  this.refresh();
}

clearDirectMessageSearch() {
  this.dmSearchResults = null;
  this.refresh();
}

  openProfileModal() {
    const user = this.authService.getCurrentUser();

    const profileModal = new ProfileModal({
      user,
      userService: this.userService,
      onUpdate: () => {
        this.refresh();
      },
      onOpenDevTools: () => {
        this.openDevToolsModal();
      }
    });

    profileModal.open();
  }

  logout() {
    this.authService.logout();
    this.eventBus.emit("auth:logout");
  }

  getCurrentChannel() {
  const server = this.serverService.getServerById(this.currentServerId);
  const user = this.authService.getCurrentUser();

  if (!server || !user) {
    return null;
  }

  const channel = server.channels.find(
    (item) => item.id === this.currentChannelId
  );

  if (!channel) {
    return null;
  }

  const canView = this.roleService.canViewChannel(
    server.id,
    channel,
    user.id
  );

  return canView ? channel : null;
}

  refresh() {
    const oldElement = this.element;
    const newElement = this.render();

    oldElement.replaceWith(newElement);

    this.afterRender();
  }
}