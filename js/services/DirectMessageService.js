import { generateId, getCurrentDate } from "../utils/helpers.js";

export class DirectMessageService {
  constructor(storage) {
    this.storage = storage;
  }

  getDialogMessages(userId, friendId) {
    const directMessages = this.storage.get("directMessages");

    return directMessages.filter(
      (message) =>
        message.userIds.includes(userId) &&
        message.userIds.includes(friendId)
    );
  }

  toggleReaction(messageId, userId, emoji) {
  this.storage.update((database) => {
    const message = database.directMessages.find((item) => item.id === messageId);

    if (!message) {
      throw new Error("Сообщение не найдено.");
    }

    if (!message.reactions) {
      message.reactions = {};
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    const alreadyReacted = message.reactions[emoji].includes(userId);

    if (alreadyReacted) {
      message.reactions[emoji] = message.reactions[emoji].filter(
        (id) => id !== userId
      );

      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    } else {
      message.reactions[emoji].push(userId);
    }
  });
}

  togglePinMessage(messageId, userId) {
  this.storage.update((database) => {
    const message = database.directMessages.find((item) => item.id === messageId);

    if (!message) {
      throw new Error("Сообщение не найдено.");
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? userId : null;
    message.pinnedAt = message.isPinned ? new Date().toISOString() : null;
  });
}

getPinnedMessages(userId, friendId) {
  const directMessages = this.storage.get("directMessages") || [];

  return directMessages.filter((message) => {
    return (
      message.userIds.includes(userId) &&
      message.userIds.includes(friendId) &&
      message.isPinned
    );
  });
}

  sendMessage(fromUserId, toUserId, text) {
    const cleanText = text.trim();

    if (!cleanText) {
      throw new Error("Сообщение не может быть пустым.");
    }

    const message = {
      id: generateId("dm"),
      userIds: [fromUserId, toUserId],
      authorId: fromUserId,
      text: cleanText,
      createdAt: getCurrentDate(),
      editedAt: null
    };

    this.storage.update((database) => {
      database.directMessages.push(message);
    });

    return message;
  }

  editMessage(messageId, userId, newText) {
    const cleanText = newText.trim();

    if (!cleanText) {
      throw new Error("Сообщение не может быть пустым.");
    }

    this.storage.update((database) => {
      const message = database.directMessages.find(
        (item) => item.id === messageId
      );

      if (!message) {
        throw new Error("Сообщение не найдено.");
      }

      if (message.authorId !== userId) {
        throw new Error("Можно редактировать только свои сообщения.");
      }

      message.text = cleanText;
      message.editedAt = getCurrentDate();
    });
  }

  deleteMessage(messageId, userId) {
    this.storage.update((database) => {
      const message = database.directMessages.find(
        (item) => item.id === messageId
      );

      if (!message) {
        throw new Error("Сообщение не найдено.");
      }

      if (message.authorId !== userId) {
        throw new Error("Можно удалять только свои сообщения.");
      }

      database.directMessages = database.directMessages.filter(
        (item) => item.id !== messageId
      );
    });
  }
}