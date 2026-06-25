import { generateId } from "../utils/helpers.js";

export class RoleService {
  constructor(storage) {
    this.storage = storage;
  }

  migrateServers() {
    this.storage.update((database) => {
      database.servers.forEach((server) => {
        this.ensureServerRoles(server);
      });
    });
  }

  ensureServerRoles(server) {
    if (!server.roles) server.roles = [];
    if (!server.memberRoles) server.memberRoles = {};
    if (!server.members) server.members = [];
    if (!server.invites) server.invites = [];

    if (!server.members.includes(server.ownerId)) {
      server.members.push(server.ownerId);
    }

    if (server.roles.length > 0) {
      return;
    }

    const ownerRole = {
      id: generateId("role"),
      name: "Owner",
      color: "#ef4444",
      permissions: {
        createChannels: true,
        manageOwnChannels: true,
        manageAllChannels: true,
        manageMessages: true,
        manageRoles: true,
        createInvites: true,
        sendMessages: true
      }
    };

    const adminRole = {
      id: generateId("role"),
      name: "Admin",
      color: "#f97316",
      permissions: {
        createChannels: true,
        manageOwnChannels: true,
        manageAllChannels: true,
        manageMessages: true,
        manageRoles: false,
        createInvites: true,
        sendMessages: true
      }
    };

    const moderatorRole = {
      id: generateId("role"),
      name: "Moderator",
      color: "#a855f7",
      permissions: {
        createChannels: false,
        manageOwnChannels: true,
        manageAllChannels: false,
        manageMessages: true,
        manageRoles: false,
        createInvites: false,
        sendMessages: true
      }
    };

    const memberRole = {
      id: generateId("role"),
      name: "Member",
      color: "#22c55e",
      permissions: {
        createChannels: false,
        manageOwnChannels: true,
        manageAllChannels: false,
        manageMessages: false,
        manageRoles: false,
        createInvites: false,
        sendMessages: true
      }
    };

    server.roles.push(ownerRole, adminRole, moderatorRole, memberRole);
    server.memberRoles[server.ownerId] = [ownerRole.id];
  }

  getServer(serverId) {
    return this.storage
      .get("servers")
      .find((server) => server.id === serverId) || null;
  }

  getUserRoles(serverId, userId) {
    const server = this.getServer(serverId);

    if (!server) return [];

    this.ensureServerRoles(server);

    const roleIds = server.memberRoles[userId] || [];

    return server.roles.filter((role) => roleIds.includes(role.id));
  }

  hasPermission(serverId, userId, permissionName) {
    const server = this.getServer(serverId);

    if (!server) return false;

    if (server.ownerId === userId) return true;

    const roles = this.getUserRoles(serverId, userId);

    return roles.some((role) => {
      return Boolean(role.permissions?.[permissionName]);
    });
  }

  canManageChannel(serverId, channel, userId) {
    const server = this.getServer(serverId);

    if (!server || !channel) return false;

    if (server.ownerId === userId) return true;

    if (this.hasPermission(serverId, userId, "manageAllChannels")) {
      return true;
    }

    if (
      channel.ownerId === userId &&
      this.hasPermission(serverId, userId, "manageOwnChannels")
    ) {
      return true;
    }

    return false;
  }

  canViewChannel(serverId, channel, userId) {
  const server = this.getServer(serverId);

  if (!server || !channel) {
    return false;
  }

  if (!server.members?.includes(userId) && server.ownerId !== userId) {
    return false;
  }

  if (!channel.isPrivate) {
    return true;
  }

  if (server.ownerId === userId) {
    return true;
  }

  if (channel.ownerId === userId) {
    return true;
  }

  if (channel.allowedMembers?.includes(userId)) {
    return true;
  }

  const userRoles = this.getUserRoles(serverId, userId);
  const userRoleIds = userRoles.map((role) => role.id);

  return channel.allowedRoles?.some((roleId) => userRoleIds.includes(roleId));
}

  assignRole(serverId, targetUserId, roleId, actorUserId) {
    if (!this.hasPermission(serverId, actorUserId, "manageRoles")) {
      throw new Error("У тебя нет права выдавать роли.");
    }

    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      this.ensureServerRoles(server);

      if (!server.members.includes(targetUserId)) {
        throw new Error("Пользователь не состоит в сервере.");
      }

      const role = server.roles.find((item) => item.id === roleId);

      if (!role) {
        throw new Error("Роль не найдена.");
      }

      if (!server.memberRoles[targetUserId]) {
        server.memberRoles[targetUserId] = [];
      }

      if (server.memberRoles[targetUserId].includes(roleId)) {
        throw new Error("У пользователя уже есть эта роль.");
      }

      server.memberRoles[targetUserId].push(roleId);
    });
  }

  removeRole(serverId, targetUserId, roleId, actorUserId) {
  if (!this.hasPermission(serverId, actorUserId, "manageRoles")) {
    throw new Error("У тебя нет права снимать роли.");
  }

  this.storage.update((database) => {
    const server = database.servers.find((item) => item.id === serverId);

    if (!server) {
      throw new Error("Сервер не найден.");
    }

    if (server.ownerId === targetUserId) {
      throw new Error("Нельзя менять роли владельца сервера.");
    }

    if (!server.memberRoles[targetUserId]) {
      return;
    }

    server.memberRoles[targetUserId] = server.memberRoles[targetUserId].filter(
      (id) => id !== roleId
    );
  });
}

getAssignableRoles(serverId) {
  const server = this.getServer(serverId);

  if (!server) {
    return [];
  }

  this.ensureServerRoles(server);

  return server.roles.filter((role) => role.name !== "Owner");
}

  getRoleLabel(serverId, userId) {
    const server = this.getServer(serverId);

    if (!server) return "Member";

    if (server.ownerId === userId) return "Owner";

    const roles = this.getUserRoles(serverId, userId);

    if (roles.length === 0) {
      return "Member";
    }

    return roles.map((role) => role.name).join(", ");
  }
}