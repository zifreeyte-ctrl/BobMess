export class SearchService {
  constructor(storage) {
    this.storage = storage;
  }

  searchChannelMessages(channelId, query) {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return [];
    }

    const messages = this.storage.get("messages");

    return messages.filter((message) => {
      return (
        message.channelId === channelId &&
        message.text.toLowerCase().includes(cleanQuery)
      );
    });
  }

  searchDirectMessages(userId, friendId, query) {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return [];
    }

    const directMessages = this.storage.get("directMessages");

    return directMessages.filter((message) => {
      return (
        message.userIds.includes(userId) &&
        message.userIds.includes(friendId) &&
        message.text.toLowerCase().includes(cleanQuery)
      );
    });
  }
}