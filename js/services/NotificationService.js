import { generateId, getCurrentDate } from "../utils/helpers.js";

export class NotificationService {
  constructor(storage) {
    this.storage = storage;
  }

  getNotifications() {
    return this.storage.get("notifications") || [];
  }

  getNotificationsForUser(userId) {
    return this.getNotifications()
      .filter((notification) => notification.userId === userId)
      .sort((first, second) => {
        return new Date(second.createdAt) - new Date(first.createdAt);
      });
  }

  getUnreadNotificationsForUser(userId) {
    return this.getNotificationsForUser(userId).filter((notification) => {
      return !notification.readAt;
    });
  }

  getUnreadNotificationCount(userId) {
    return this.getUnreadNotificationsForUser(userId).length;
  }

  getUnreadFriendEventCount(userId) {
    return this.getUnreadNotificationsForUser(userId).filter((notification) => {
      return (
        notification.type === "friend_request" ||
        notification.type === "friend_request_accepted"
      );
    }).length;
  }

  createNotification({
    userId,
    type,
    title,
    message,
    sourceUserId = null,
    serverId = null,
    channelId = null,
    entityId = null
  }) {
    if (!userId || !type) {
      return null;
    }

    const notification = {
      id: generateId("notification"),
      userId,
      type,
      title: title || "Уведомление",
      message: message || "",
      sourceUserId,
      serverId,
      channelId,
      entityId,
      createdAt: getCurrentDate(),
      readAt: null
    };

    this.storage.update((database) => {
      if (!Array.isArray(database.notifications)) {
        database.notifications = [];
      }

      const alreadyExists = database.notifications.some((item) => {
        return (
          item.userId === notification.userId &&
          item.type === notification.type &&
          item.entityId &&
          item.entityId === notification.entityId
        );
      });

      if (!alreadyExists) {
        database.notifications.push(notification);
      }
    });

    return notification;
  }

  createFriendRequestNotification(fromUserId, toUserId, requestId) {
    const users = this.storage.get("users") || [];
    const fromUser = users.find((user) => user.id === fromUserId);

    return this.createNotification({
      userId: toUserId,
      type: "friend_request",
      title: "Новая заявка в друзья",
      message: `${fromUser?.username || "Пользователь"} хочет добавить тебя в друзья.`,
      sourceUserId: fromUserId,
      entityId: requestId
    });
  }

  createFriendRequestAcceptedNotification(acceptedByUserId, targetUserId, requestId) {
    const users = this.storage.get("users") || [];
    const acceptedByUser = users.find((user) => user.id === acceptedByUserId);

    return this.createNotification({
      userId: targetUserId,
      type: "friend_request_accepted",
      title: "Заявка принята",
      message: `${acceptedByUser?.username || "Пользователь"} принял твою заявку в друзья.`,
      sourceUserId: acceptedByUserId,
      entityId: requestId
    });
  }

  createDirectMessageNotification(fromUserId, toUserId, messageId) {
    const users = this.storage.get("users") || [];
    const fromUser = users.find((user) => user.id === fromUserId);

    return this.createNotification({
      userId: toUserId,
      type: "direct_message",
      title: "Новое личное сообщение",
      message: `${fromUser?.username || "Пользователь"} отправил тебе сообщение.`,
      sourceUserId: fromUserId,
      entityId: messageId
    });
  }

  createChannelMessageNotifications(server, channelId, messageId, authorId) {
    if (!server || !Array.isArray(server.members)) {
      return;
    }

    const channel = server.channels.find((item) => item.id === channelId);
    const users = this.storage.get("users") || [];
    const author = users.find((user) => user.id === authorId);

    server.members.forEach((memberId) => {
      if (memberId === authorId) {
        return;
      }

      this.createNotification({
        userId: memberId,
        type: "channel_message",
        title: "Новое сообщение в канале",
        message: `${author?.username || "Пользователь"} написал в #${channel?.name || "канале"}.`,
        sourceUserId: authorId,
        serverId: server.id,
        channelId,
        entityId: messageId
      });
    });
  }

  markNotificationAsRead(notificationId, userId) {
    this.storage.update((database) => {
      if (!Array.isArray(database.notifications)) {
        database.notifications = [];
      }

      database.notifications = database.notifications.map((notification) => {
        if (
          notification.id !== notificationId ||
          notification.userId !== userId
        ) {
          return notification;
        }

        return {
          ...notification,
          readAt: getCurrentDate()
        };
      });
    });
  }

  markFriendEventsAsRead(userId) {
    this.storage.update((database) => {
      if (!Array.isArray(database.notifications)) {
        database.notifications = [];
      }

      database.notifications = database.notifications.map((notification) => {
        const isFriendEvent =
          notification.type === "friend_request" ||
          notification.type === "friend_request_accepted";

        if (notification.userId !== userId || !isFriendEvent) {
          return notification;
        }

        return {
          ...notification,
          readAt: notification.readAt || getCurrentDate()
        };
      });
    });
  }

  markChannelAsRead(userId, channelId) {
    if (!userId || !channelId) {
      return;
    }

    this.storage.update((database) => {
      if (!database.readState) {
        database.readState = {
          channels: {},
          dialogs: {}
        };
      }

      if (!database.readState.channels) {
        database.readState.channels = {};
      }

      if (!database.readState.channels[userId]) {
        database.readState.channels[userId] = {};
      }

      database.readState.channels[userId][channelId] = Date.now();

      if (Array.isArray(database.notifications)) {
        database.notifications = database.notifications.map((notification) => {
          if (
            notification.userId === userId &&
            notification.channelId === channelId &&
            notification.type === "channel_message"
          ) {
            return {
              ...notification,
              readAt: notification.readAt || getCurrentDate()
            };
          }

          return notification;
        });
      }
    });
  }

  markDialogAsRead(userId, friendId) {
    if (!userId || !friendId) {
      return;
    }

    const dialogKey = this.getDialogKey(userId, friendId);

    this.storage.update((database) => {
      if (!database.readState) {
        database.readState = {
          channels: {},
          dialogs: {}
        };
      }

      if (!database.readState.dialogs) {
        database.readState.dialogs = {};
      }

      if (!database.readState.dialogs[userId]) {
        database.readState.dialogs[userId] = {};
      }

      database.readState.dialogs[userId][dialogKey] = Date.now();

      if (Array.isArray(database.notifications)) {
        database.notifications = database.notifications.map((notification) => {
          const isDialogNotification =
            notification.type === "direct_message" &&
            notification.userId === userId &&
            notification.sourceUserId === friendId;

          if (!isDialogNotification) {
            return notification;
          }

          return {
            ...notification,
            readAt: notification.readAt || getCurrentDate()
          };
        });
      }
    });
  }

  getUnreadChannelCount(userId, channelId) {
    const database = this.storage.getDatabase();

    if (!database) {
      return 0;
    }

    const messages = database.messages || [];

    const lastRead =
      database.readState?.channels?.[userId]?.[channelId] || 0;

    return messages.filter((message) => {
      const createdAt = new Date(message.createdAt).getTime();

      return (
        message.channelId === channelId &&
        message.authorId !== userId &&
        createdAt > lastRead
      );
    }).length;
  }

  getUnreadServerCount(userId, server) {
    if (!server || !Array.isArray(server.channels)) {
      return 0;
    }

    return server.channels.reduce((total, channel) => {
      return total + this.getUnreadChannelCount(userId, channel.id);
    }, 0);
  }

  getTotalUnreadServersCount(userId, servers) {
    if (!Array.isArray(servers)) {
      return 0;
    }

    return servers.reduce((total, server) => {
      return total + this.getUnreadServerCount(userId, server);
    }, 0);
  }

  getUnreadDialogCount(userId, friendId) {
    const database = this.storage.getDatabase();

    if (!database) {
      return 0;
    }

    const directMessages = database.directMessages || [];
    const dialogKey = this.getDialogKey(userId, friendId);

    const lastRead =
      database.readState?.dialogs?.[userId]?.[dialogKey] || 0;

    return directMessages.filter((message) => {
      const createdAt = new Date(message.createdAt).getTime();

      return (
        message.userIds.includes(userId) &&
        message.userIds.includes(friendId) &&
        message.authorId !== userId &&
        createdAt > lastRead
      );
    }).length;
  }

  getTotalUnreadDialogsCount(userId, friends) {
    if (!Array.isArray(friends)) {
      return 0;
    }

    return friends.reduce((total, friend) => {
      return total + this.getUnreadDialogCount(userId, friend.id);
    }, 0);
  }

  getIncomingFriendRequestCount(userId) {
    const friendRequests = this.storage.get("friendRequests") || [];

    return friendRequests.filter((request) => {
      return request.toUserId === userId && request.status === "pending";
    }).length;
  }

  getOutgoingFriendRequestCount(userId) {
    const friendRequests = this.storage.get("friendRequests") || [];

    return friendRequests.filter((request) => {
      return request.fromUserId === userId && request.status === "pending";
    }).length;
  }

  getDirectMessagesBadgeCount(userId, friends) {
    return (
      this.getTotalUnreadDialogsCount(userId, friends) +
      this.getIncomingFriendRequestCount(userId) +
      this.getUnreadFriendEventCount(userId)
    );
  }

  getDialogKey(userId, friendId) {
    return [userId, friendId].sort().join("__");
  }
}