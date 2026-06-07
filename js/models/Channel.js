export class Channel {
  constructor({
    id,
    serverId,
    name,
    type = "text",
    ownerId,
    createdAt
  }) {
    this.id = id;
    this.serverId = serverId;
    this.name = name;
    this.type = type;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
  }
}