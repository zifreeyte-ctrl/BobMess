export class NotificationService {
  constructor(storage) {
    this.storage = storage;
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

      if (!database.readState.channels[userId]) {
        database.readState.channels[userId] = {};
      }

      database.readState.channels[userId][channelId] = Date.now();
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

      if (!database.readState.dialogs[userId]) {
        database.readState.dialogs[userId] = {};
      }

      database.readState.dialogs[userId][dialogKey] = Date.now();
    });
  }

  getUnreadChannelCount(userId, channelId) {
    const database = this.storage.getDatabase();

    const lastRead =
      database.readState?.channels?.[userId]?.[channelId] || 0;

    return database.messages.filter((message) => {
      const createdAt = new Date(message.createdAt).getTime();

      return (
        message.channelId === channelId &&
        message.authorId !== userId &&
        createdAt > lastRead
      );
    }).length;
  }

  getUnreadServerCount(userId, server) {
    return server.channels.reduce((total, channel) => {
      return total + this.getUnreadChannelCount(userId, channel.id);
    }, 0);
  }

  getUnreadDialogCount(userId, friendId) {
    const database = this.storage.getDatabase();
    const dialogKey = this.getDialogKey(userId, friendId);

    const lastRead =
      database.readState?.dialogs?.[userId]?.[dialogKey] || 0;

    return database.directMessages.filter((message) => {
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
    return friends.reduce((total, friend) => {
      return total + this.getUnreadDialogCount(userId, friend.id);
    }, 0);
  }

  getDialogKey(userId, friendId) {
    return [userId, friendId].sort().join("__");
  }
}