import { Server } from "../models/Server.js";
import { Channel } from "../models/Channel.js";
import { generateId, getCurrentDate } from "../utils/helpers.js";

export class ServerService {
  constructor(storage) {
    this.storage = storage;
  }

  createDefaultDataIfNeeded() {
    const servers = this.storage.get("servers");
    const currentUserId = this.storage.get("currentUserId");

    if (servers.length > 0) {
      return;
    }

    const serverId = generateId("server");

    const channels = [
      new Channel({
        id: generateId("channel"),
        serverId,
        name: "general",
        type: "text",
        ownerId: currentUserId,
        createdAt: getCurrentDate()
      })
    ];

    const server = new Server({
      id: serverId,
      name: "BOB Main Server",
      icon: "B",
      ownerId: currentUserId,
      members: [currentUserId],
      channels,
      roles: [],
      memberRoles: {},
      invites: [],
      createdAt: getCurrentDate()
    });

    this.storage.update((database) => {
      database.servers.push(server);
    });
  }

  getServers() {
    return this.storage.get("servers");
  }

  getServersForUser(userId) {
    return this.getServers().filter((server) => {
      return server.members?.includes(userId) || server.ownerId === userId;
    });
  }

  getServerById(serverId) {
    return this.getServers().find((server) => server.id === serverId) || null;
  }

  createServer(name, ownerId) {
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      throw new Error("Название сервера должно быть минимум 2 символа.");
    }

    const server = new Server({
      id: generateId("server"),
      name: cleanName,
      icon: cleanName[0].toUpperCase(),
      ownerId,
      members: [ownerId],
      channels: [],
      roles: [],
      memberRoles: {},
      invites: [],
      createdAt: getCurrentDate()
    });

    this.storage.update((database) => {
      database.servers.push(server);
    });

    this.createChannel(server.id, "general", ownerId);

    return server;
  }

  createChannel(serverId, name, ownerId, options = {}) {
    const cleanName = this.normalizeChannelName(name);

    if (cleanName.length < 2) {
      throw new Error("Название канала должно быть минимум 2 символа.");
    }

    const channel = new Channel({
      id: generateId("channel"),
      serverId,
      name: cleanName,
      type: "text",
      ownerId,
      isPrivate: Boolean(options.isPrivate),
      allowedMembers: options.allowedMembers || [],
      allowedRoles: options.allowedRoles || [],
      createdAt: getCurrentDate()
    });

    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      const exists = server.channels.some(
        (item) => item.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
        throw new Error("Канал с таким названием уже существует.");
      }

      server.channels.push(channel);
    });

    return channel;
  }

  updateChannelSettings(serverId, channelId, data) {
  const cleanName = this.normalizeChannelName(data.name);

  if (cleanName.length < 2) {
    throw new Error("Название канала должно быть минимум 2 символа.");
  }

  this.storage.update((database) => {
    const server = database.servers.find((item) => item.id === serverId);

    if (!server) {
      throw new Error("Сервер не найден.");
    }

    const channel = server.channels.find((item) => item.id === channelId);

    if (!channel) {
      throw new Error("Канал не найден.");
    }

    const exists = server.channels.some(
      (item) =>
        item.id !== channelId &&
        item.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      throw new Error("Канал с таким названием уже существует.");
    }

    channel.name = cleanName;
    channel.isPrivate = Boolean(data.isPrivate);
    channel.allowedMembers = data.allowedMembers || [];
    channel.allowedRoles = data.allowedRoles || [];
  });
} 

  renameChannel(serverId, channelId, newName) {
    const cleanName = this.normalizeChannelName(newName);

    if (cleanName.length < 2) {
      throw new Error("Название канала должно быть минимум 2 символа.");
    }

    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      const channel = server.channels.find((item) => item.id === channelId);

      if (!channel) {
        throw new Error("Канал не найден.");
      }

      channel.name = cleanName;
    });
  }

  deleteChannel(serverId, channelId) {
    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      if (server.channels.length <= 1) {
        throw new Error("Нельзя удалить последний канал сервера.");
      }

      server.channels = server.channels.filter(
        (channel) => channel.id !== channelId
      );

      database.messages = database.messages.filter(
        (message) => message.channelId !== channelId
      );
    });
  }

  updateServerIcon(serverId, userId, icon) {
  this.storage.update((database) => {
    const server = database.servers.find((item) => item.id === serverId);

    if (!server) {
      throw new Error("Сервер не найден.");
    }

    if (server.ownerId !== userId) {
      throw new Error("Только владелец может менять иконку сервера.");
    }

    server.icon = icon;
  });
}

  renameServer(serverId, newName, userId) {
    const cleanName = newName.trim();

    if (cleanName.length < 2) {
      throw new Error("Название сервера должно быть минимум 2 символа.");
    }

    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      if (server.ownerId !== userId) {
        throw new Error("Только владелец может менять сервер.");
      }

      server.name = cleanName;
      server.icon = cleanName[0].toUpperCase();
    });
  }

  deleteServer(serverId, userId) {
    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      if (server.ownerId !== userId) {
        throw new Error("Только владелец может удалить сервер.");
      }

      const channelIds = server.channels.map((channel) => channel.id);

      database.servers = database.servers.filter(
        (item) => item.id !== serverId
      );

      database.messages = database.messages.filter(
        (message) => !channelIds.includes(message.channelId)
      );
    });
  }

  createInvite(serverId, userId) {
    const inviteCode = `bob-${Math.random().toString(36).slice(2, 8)}`;

    this.storage.update((database) => {
      const server = database.servers.find((item) => item.id === serverId);

      if (!server) {
        throw new Error("Сервер не найден.");
      }

      if (!server.invites) {
        server.invites = [];
      }

      server.invites.push({
        code: inviteCode,
        createdBy: userId,
        createdAt: getCurrentDate()
      });
    });

    return inviteCode;
  }

  joinServerByInvite(inviteCode, userId) {
    const cleanCode = inviteCode.trim();

    let joinedServer = null;

    this.storage.update((database) => {
      const server = database.servers.find((item) => {
        return item.invites?.some((invite) => invite.code === cleanCode);
      });

      if (!server) {
        throw new Error("Инвайт не найден.");
      }

      if (!server.members) {
        server.members = [];
      }

      if (server.members.includes(userId)) {
        throw new Error("Ты уже состоишь в этом сервере.");
      }

      server.members.push(userId);
      joinedServer = server;
    });

    return joinedServer;
  }

  normalizeChannelName(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zа-яё0-9-_]/gi, "");
  }
}