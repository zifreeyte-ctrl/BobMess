import { Message } from "../models/Message.js";
import { generateId, getCurrentDate } from "../utils/helpers.js";

export class ChatService {
  constructor(storage) {
    this.storage = storage;
  }

  getMessagesByChannel(channelId) {
    const messages = this.storage.get("messages");

    return messages.filter((message) => message.channelId === channelId);
  }

  sendMessage(channelId, authorId, text, attachment = null) {
  const cleanText = text.trim();

  if (!cleanText && !attachment) {
    throw new Error("Сообщение не может быть пустым.");
  }

  const message = {
    id: generateId("message"),
    channelId,
    authorId,
    text: cleanText,
    attachment,
    reactions: {},
    isPinned: false,
    pinnedBy: null,
    pinnedAt: null,
    createdAt: getCurrentDate(),
    editedAt: null
  };

  this.storage.update((database) => {
    database.messages.push(message);
  });

  return message;
}

  toggleReaction(messageId, userId, emoji) {
  this.storage.update((database) => {
    const message = database.messages.find((item) => item.id === messageId);

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
    const message = database.messages.find((item) => item.id === messageId);

    if (!message) {
      throw new Error("Сообщение не найдено.");
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? userId : null;
    message.pinnedAt = message.isPinned ? new Date().toISOString() : null;
  });
}

getPinnedMessagesByChannel(channelId) {
  const messages = this.storage.get("messages") || [];

  return messages.filter((message) => {
    return message.channelId === channelId && message.isPinned;
  });
}

  deleteMessage(messageId, userId) {
    const messages = this.storage.get("messages");
    const message = messages.find((item) => item.id === messageId);

    if (!message) {
      throw new Error("Сообщение не найдено.");
    }

    if (message.authorId !== userId) {
      throw new Error("Можно удалять только свои сообщения.");
    }

    this.storage.update((database) => {
      database.messages = database.messages.filter(
        (item) => item.id !== messageId
      );
    });
  }

  editMessage(messageId, userId, newText) {
    this.storage.update((database) => {
      const message = database.messages.find((item) => item.id === messageId);

      if (!message) {
        throw new Error("Сообщение не найдено.");
      }

      if (message.authorId !== userId) {
        throw new Error("Можно редактировать только свои сообщения.");
      }

      message.text = newText.trim();
      message.editedAt = getCurrentDate();
    });
  }
}