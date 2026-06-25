function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function normalizeChannel(channel) {
  return {
    id: channel.id,
    serverId: channel.serverId || channel.server_id,
    name: channel.name,
    type: channel.type || "text",
    ownerId: channel.ownerId || channel.owner_id,
    isPrivate: Boolean(channel.isPrivate ?? channel.is_private),
    allowedMembers: toArray(channel.allowedMembers || channel.allowed_members),
    allowedRoles: toArray(channel.allowedRoles || channel.allowed_roles),
    createdAt: channel.createdAt || channel.created_at,
    updatedAt: channel.updatedAt || channel.updated_at
  };
}

function normalizeRole(role) {
  return {
    id: role.id,
    serverId: role.serverId || role.server_id,
    name: role.name,
    color: role.color || "",
    permissions: toArray(role.permissions),
    createdAt: role.createdAt || role.created_at,
    updatedAt: role.updatedAt || role.updated_at
  };
}

export function normalizeServer(row) {
  if (!row) {
    return null;
  }

  const channels = toArray(row.channels).map(normalizeChannel);
  const roles = toArray(row.roles).map(normalizeRole);
  const members = toArray(row.members).filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    ownerId: row.owner_id || row.ownerId,
    members,
    channels,
    roles,
    memberRoles: row.member_roles || {},
    invites: [],
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}