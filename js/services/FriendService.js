import { generateId, getCurrentDate } from "../utils/helpers.js";

export class FriendService {
  constructor(storage) {
    this.storage = storage;
  }

  getFriendships() {
    return this.storage.get("friendships") || [];
  }

  getFriendRequests() {
    return this.storage.get("friendRequests") || [];
  }

  getBlockedUsers() {
    return this.storage.get("blockedUsers") || [];
  }

  getBlockedUsersForUser(userId) {
    const users = this.storage.get("users") || [];
    const blockedRecords = this.getBlockedUsers().filter((record) => {
      return record.blockerId === userId;
    });

    return blockedRecords
      .map((record) => {
        const user = users.find((item) => item.id === record.blockedUserId);

        if (!user) {
          return null;
        }

        return {
          ...user,
          blockId: record.id,
          blockedAt: record.createdAt
        };
      })
      .filter(Boolean);
  }

  isUserBlockedBy(blockerId, blockedUserId) {
    return this.getBlockedUsers().some((record) => {
      return (
        record.blockerId === blockerId &&
        record.blockedUserId === blockedUserId
      );
    });
  }

  isBlockedBetween(firstUserId, secondUserId) {
    return (
      this.isUserBlockedBy(firstUserId, secondUserId) ||
      this.isUserBlockedBy(secondUserId, firstUserId)
    );
  }

  getFriendsForUser(userId) {
    const users = this.storage.get("users") || [];
    const friendships = this.getFriendships();

    const friendIds = friendships
      .filter((friendship) => friendship.userIds.includes(userId))
      .map((friendship) => friendship.userIds.find((id) => id !== userId));

    return users.filter((user) => friendIds.includes(user.id));
  }

  getIncomingRequests(userId) {
    return this.getFriendRequests().filter((request) => {
      return request.toUserId === userId && request.status === "pending";
    });
  }

  getOutgoingRequests(userId) {
    return this.getFriendRequests().filter((request) => {
      return request.fromUserId === userId && request.status === "pending";
    });
  }

  areFriends(firstUserId, secondUserId) {
    return this.getFriendships().some((friendship) => {
      return (
        friendship.userIds.includes(firstUserId) &&
        friendship.userIds.includes(secondUserId)
      );
    });
  }

  getPendingRequestBetween(firstUserId, secondUserId) {
    return this.getFriendRequests().find((request) => {
      const sameUsers =
        (request.fromUserId === firstUserId && request.toUserId === secondUserId) ||
        (request.fromUserId === secondUserId && request.toUserId === firstUserId);

      return sameUsers && request.status === "pending";
    });
  }

  sendFriendRequestByUsername(currentUserId, username) {
    const users = this.storage.get("users") || [];
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      throw new Error("Введи ник пользователя.");
    }

    const targetUser = users.find((user) => {
      return user.username.toLowerCase() === cleanUsername;
    });

    if (!targetUser) {
      throw new Error("Пользователь с таким ником не найден.");
    }

    if (targetUser.id === currentUserId) {
      throw new Error("Нельзя отправить заявку самому себе.");
    }

    if (this.isUserBlockedBy(currentUserId, targetUser.id)) {
      throw new Error("Ты заблокировал этого пользователя. Сначала разблокируй его в профиле.");
    }

    if (this.isUserBlockedBy(targetUser.id, currentUserId)) {
      throw new Error("Нельзя отправить заявку этому пользователю.");
    }

    if (this.areFriends(currentUserId, targetUser.id)) {
      throw new Error("Этот пользователь уже у тебя в друзьях.");
    }

    const existingRequest = this.getPendingRequestBetween(
      currentUserId,
      targetUser.id
    );

    if (existingRequest) {
      if (existingRequest.fromUserId === currentUserId) {
        throw new Error("Ты уже отправил заявку этому пользователю.");
      }

      this.acceptFriendRequest(existingRequest.id, currentUserId);

      return {
        ...existingRequest,
        status: "accepted"
      };
    }

    const request = {
      id: generateId("friend_request"),
      fromUserId: currentUserId,
      toUserId: targetUser.id,
      status: "pending",
      createdAt: getCurrentDate(),
      answeredAt: null
    };

    this.storage.update((database) => {
      if (!Array.isArray(database.friendRequests)) {
        database.friendRequests = [];
      }

      database.friendRequests.push(request);
    });

    return request;
  }

  acceptFriendRequest(requestId, currentUserId) {
    const requests = this.getFriendRequests();
    const request = requests.find((item) => item.id === requestId);

    if (!request) {
      throw new Error("Заявка не найдена.");
    }

    if (request.toUserId !== currentUserId) {
      throw new Error("Ты не можешь принять эту заявку.");
    }

    if (request.status !== "pending") {
      throw new Error("Эта заявка уже обработана.");
    }

    if (this.isBlockedBetween(request.fromUserId, request.toUserId)) {
      throw new Error("Нельзя принять заявку: между пользователями есть блокировка.");
    }

    this.storage.update((database) => {
      if (!Array.isArray(database.friendships)) {
        database.friendships = [];
      }

      const alreadyFriends = database.friendships.some((friendship) => {
        return (
          friendship.userIds.includes(request.fromUserId) &&
          friendship.userIds.includes(request.toUserId)
        );
      });

      if (!alreadyFriends) {
        database.friendships.push({
          id: generateId("friendship"),
          userIds: [request.fromUserId, request.toUserId],
          createdAt: getCurrentDate()
        });
      }

      database.friendRequests = database.friendRequests.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        return {
          ...item,
          status: "accepted",
          answeredAt: getCurrentDate()
        };
      });
    });
  }

  rejectFriendRequest(requestId, currentUserId) {
    const request = this.getFriendRequests().find((item) => item.id === requestId);

    if (!request) {
      throw new Error("Заявка не найдена.");
    }

    if (request.toUserId !== currentUserId) {
      throw new Error("Ты не можешь отклонить эту заявку.");
    }

    this.storage.update((database) => {
      database.friendRequests = database.friendRequests.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        return {
          ...item,
          status: "rejected",
          answeredAt: getCurrentDate()
        };
      });
    });
  }

  cancelFriendRequest(requestId, currentUserId) {
    const request = this.getFriendRequests().find((item) => item.id === requestId);

    if (!request) {
      throw new Error("Заявка не найдена.");
    }

    if (request.fromUserId !== currentUserId) {
      throw new Error("Ты не можешь отменить эту заявку.");
    }

    this.storage.update((database) => {
      database.friendRequests = database.friendRequests.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        return {
          ...item,
          status: "cancelled",
          answeredAt: getCurrentDate()
        };
      });
    });
  }

  addFriendByUsername(currentUserId, username) {
    return this.sendFriendRequestByUsername(currentUserId, username);
  }

  removeFriend(currentUserId, friendId) {
    this.storage.update((database) => {
      database.friendships = database.friendships.filter((friendship) => {
        return !(
          friendship.userIds.includes(currentUserId) &&
          friendship.userIds.includes(friendId)
        );
      });

      database.directMessages = database.directMessages.filter((message) => {
        const isDialogMessage =
          message.userIds.includes(currentUserId) &&
          message.userIds.includes(friendId);

        return !isDialogMessage;
      });
    });
  }

  blockUser(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) {
      throw new Error("Нельзя заблокировать самого себя.");
    }

    const users = this.storage.get("users") || [];
    const targetUser = users.find((user) => user.id === targetUserId);

    if (!targetUser) {
      throw new Error("Пользователь не найден.");
    }

    if (this.isUserBlockedBy(currentUserId, targetUserId)) {
      throw new Error("Пользователь уже заблокирован.");
    }

    const blockRecord = {
      id: generateId("blocked_user"),
      blockerId: currentUserId,
      blockedUserId: targetUserId,
      createdAt: getCurrentDate()
    };

    this.storage.update((database) => {
      if (!Array.isArray(database.blockedUsers)) {
        database.blockedUsers = [];
      }

      database.blockedUsers.push(blockRecord);

      database.friendships = (database.friendships || []).filter((friendship) => {
        return !(
          friendship.userIds.includes(currentUserId) &&
          friendship.userIds.includes(targetUserId)
        );
      });

      database.friendRequests = (database.friendRequests || []).map((request) => {
        const isBetweenUsers =
          (request.fromUserId === currentUserId && request.toUserId === targetUserId) ||
          (request.fromUserId === targetUserId && request.toUserId === currentUserId);

        if (!isBetweenUsers || request.status !== "pending") {
          return request;
        }

        return {
          ...request,
          status: "cancelled",
          answeredAt: getCurrentDate()
        };
      });
    });

    return blockRecord;
  }

  unblockUser(currentUserId, targetUserId) {
    this.storage.update((database) => {
      database.blockedUsers = (database.blockedUsers || []).filter((record) => {
        return !(
          record.blockerId === currentUserId &&
          record.blockedUserId === targetUserId
        );
      });
    });
  }
}