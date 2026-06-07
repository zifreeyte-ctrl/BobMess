export class Server {
  constructor({
    id,
    name,
    icon,
    ownerId,
    members = [],
    channels = [],
    roles = [],
    memberRoles = {},
    invites = [],
    createdAt
  }) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.ownerId = ownerId;
    this.members = members;
    this.channels = channels;
    this.roles = roles;
    this.memberRoles = memberRoles;
    this.invites = invites;
    this.createdAt = createdAt;
  }
}