export function normalizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    status: row.status || "online",
    bio: row.bio || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}