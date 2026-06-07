import { generateId, getCurrentDate } from "../utils/helpers.js";

export class FriendService {
  constructor(storage) {
    this.storage = storage;
  }

  getFriendships() {
    return this.storage.get("friendships");
  }

  getFriendsForUser(userId) {
    const users = this.storage.get("users");
    const friendships = this.getFriendships();

    const friendIds = friendships
      .filter((friendship) => friendship.userIds.includes(userId))
      .map((friendship) =>
        friendship.userIds.find((id) => id !== userId)
      );

    return users.filter((user) => friendIds.includes(user.id));
  }

  addFriendByUsername(currentUserId, username) {
    const users = this.storage.get("users");
    const cleanUsername = username.trim().toLowerCase();

    const friend = users.find(
      (user) => user.username.toLowerCase() === cleanUsername
    );

    if (!friend) {
      throw new Error("Пользователь с таким ником не найден.");
    }

    if (friend.id === currentUserId) {
      throw new Error("Нельзя добавить самого себя.");
    }

    const friendships = this.getFriendships();

    const alreadyFriends = friendships.some(
      (friendship) =>
        friendship.userIds.includes(currentUserId) &&
        friendship.userIds.includes(friend.id)
    );

    if (alreadyFriends) {
      throw new Error("Этот пользователь уже у тебя в друзьях.");
    }

    const friendship = {
      id: generateId("friendship"),
      userIds: [currentUserId, friend.id],
      createdAt: getCurrentDate()
    };

    this.storage.update((database) => {
      database.friendships.push(friendship);
    });

    return friend;
  }

  removeFriend(currentUserId, friendId) {
    this.storage.update((database) => {
      database.friendships = database.friendships.filter(
        (friendship) =>
          !(
            friendship.userIds.includes(currentUserId) &&
            friendship.userIds.includes(friendId)
          )
      );

      database.directMessages = database.directMessages.filter((message) => {
        const isDialogMessage =
          message.userIds.includes(currentUserId) &&
          message.userIds.includes(friendId);

        return !isDialogMessage;
      });
    });
  }
}