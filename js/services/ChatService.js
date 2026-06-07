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

  sendMessage(channelId, authorId, text) {
    if (!text.trim()) {
      throw new Error("Сообщение не может быть пустым.");
    }

    const message = new Message({
      id: generateId("message"),
      channelId,
      authorId,
      text: text.trim(),
      createdAt: getCurrentDate()
    });

    this.storage.update((database) => {
      database.messages.push(message);
    });

    return message;
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