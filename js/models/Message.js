export class Message {
  constructor({ id, channelId, authorId, text, createdAt, editedAt = null }) {
    this.id = id;
    this.channelId = channelId;
    this.authorId = authorId;
    this.text = text;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
  }
}