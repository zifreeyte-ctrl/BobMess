export class Channel {
  constructor({
    id,
    serverId,
    name,
    type = "text",
    ownerId,
    isPrivate = false,
    allowedMembers = [],
    allowedRoles = [],
    createdAt
  }) {
    this.id = id;
    this.serverId = serverId;
    this.name = name;
    this.type = type;
    this.ownerId = ownerId;
    this.isPrivate = isPrivate;
    this.allowedMembers = allowedMembers;
    this.allowedRoles = allowedRoles;
    this.createdAt = createdAt;
  }
}