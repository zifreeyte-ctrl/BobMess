export class User {
  constructor({
    id,
    username,
    password,
    avatar,
    status = "online",
    bio = "",
    createdAt
  }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.avatar = avatar;
    this.status = status;
    this.bio = bio;
    this.createdAt = createdAt;
  }
}