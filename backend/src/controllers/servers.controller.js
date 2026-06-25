import { pool, query } from "../db/pool.js";
import { normalizeServer } from "../utils/normalizeServer.js";

function normalizeServerName(value) {
  return String(value || "").trim();
}

function normalizeServerIcon(value, name) {
  const icon = String(value || "").trim();

  if (icon) {
    return icon.slice(0, 64);
  }

  return name[0]?.toUpperCase() || "S";
}

function normalizeChannelName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-_]/gi, "");
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function validateServerName(name) {
  if (name.length < 2) {
    return "Название сервера должно быть минимум 2 символа.";
  }

  if (name.length > 64) {
    return "Название сервера должно быть максимум 64 символа.";
  }

  return null;
}

function validateChannelName(name) {
  if (name.length < 2) {
    return "Название канала должно быть минимум 2 символа.";
  }

  if (name.length > 64) {
    return "Название канала должно быть максимум 64 символа.";
  }

  return null;
}

async function getServerRow(serverId, userId, runner = pool) {
  const result = await runner.query(
    `
      SELECT
        s.id,
        s.name,
        s.icon,
        s.owner_id,
        s.created_at,
        s.updated_at,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'serverId', c.server_id,
                'name', c.name,
                'type', c.type,
                'ownerId', c.owner_id,
                'isPrivate', c.is_private,
                'allowedMembers', c.allowed_members,
                'allowedRoles', c.allowed_roles,
                'createdAt', c.created_at,
                'updatedAt', c.updated_at
              )
              ORDER BY c.created_at ASC
            )
            FROM channels c
            WHERE c.server_id = s.id
          ),
          '[]'::jsonb
        ) AS channels,
        COALESCE(
          (
            SELECT jsonb_agg(sm.user_id ORDER BY sm.joined_at ASC)
            FROM server_members sm
            WHERE sm.server_id = s.id
          ),
          '[]'::jsonb
        ) AS members,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', sr.id,
                'serverId', sr.server_id,
                'name', sr.name,
                'color', sr.color,
                'permissions', sr.permissions,
                'createdAt', sr.created_at,
                'updatedAt', sr.updated_at
              )
              ORDER BY sr.created_at ASC
            )
            FROM server_roles sr
            WHERE sr.server_id = s.id
          ),
          '[]'::jsonb
        ) AS roles
      FROM servers s
      INNER JOIN server_members current_member
        ON current_member.server_id = s.id
       AND current_member.user_id = $2
      WHERE s.id = $1
      LIMIT 1
    `,
    [serverId, userId]
  );

  return result.rows[0] || null;
}

async function getServerAccess(serverId, userId) {
  const result = await query(
    `
      SELECT
        s.id,
        s.owner_id,
        sm.user_id AS member_id
      FROM servers s
      LEFT JOIN server_members sm
        ON sm.server_id = s.id
       AND sm.user_id = $2
      WHERE s.id = $1
      LIMIT 1
    `,
    [serverId, userId]
  );

  if (result.rows.length === 0) {
    return {
      exists: false,
      isMember: false,
      isOwner: false
    };
  }

  const row = result.rows[0];

  return {
    exists: true,
    isMember: Boolean(row.member_id),
    isOwner: row.owner_id === userId
  };
}

async function ensureServerMember(serverId, userId, res) {
  const access = await getServerAccess(serverId, userId);

  if (!access.exists) {
    res.status(404).json({ message: "Сервер не найден." });
    return null;
  }

  if (!access.isMember) {
    res.status(403).json({ message: "У тебя нет доступа к этому серверу." });
    return null;
  }

  return access;
}

async function ensureServerOwner(serverId, userId, res) {
  const access = await ensureServerMember(serverId, userId, res);

  if (!access) {
    return null;
  }

  if (!access.isOwner) {
    res.status(403).json({ message: "Только владелец может менять этот сервер." });
    return null;
  }

  return access;
}

export async function listServers(req, res, next) {
  try {
    const result = await query(
      `
        SELECT
          s.id,
          s.name,
          s.icon,
          s.owner_id,
          s.created_at,
          s.updated_at,
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', c.id,
                  'serverId', c.server_id,
                  'name', c.name,
                  'type', c.type,
                  'ownerId', c.owner_id,
                  'isPrivate', c.is_private,
                  'allowedMembers', c.allowed_members,
                  'allowedRoles', c.allowed_roles,
                  'createdAt', c.created_at,
                  'updatedAt', c.updated_at
                )
                ORDER BY c.created_at ASC
              )
              FROM channels c
              WHERE c.server_id = s.id
            ),
            '[]'::jsonb
          ) AS channels,
          COALESCE(
            (
              SELECT jsonb_agg(sm.user_id ORDER BY sm.joined_at ASC)
              FROM server_members sm
              WHERE sm.server_id = s.id
            ),
            '[]'::jsonb
          ) AS members,
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', sr.id,
                  'serverId', sr.server_id,
                  'name', sr.name,
                  'color', sr.color,
                  'permissions', sr.permissions,
                  'createdAt', sr.created_at,
                  'updatedAt', sr.updated_at
                )
                ORDER BY sr.created_at ASC
              )
              FROM server_roles sr
              WHERE sr.server_id = s.id
            ),
            '[]'::jsonb
          ) AS roles
        FROM servers s
        INNER JOIN server_members current_member
          ON current_member.server_id = s.id
         AND current_member.user_id = $1
        ORDER BY s.created_at ASC
      `,
      [req.user.id]
    );

    return res.json({
      servers: result.rows.map(normalizeServer)
    });
  } catch (error) {
    return next(error);
  }
}

export async function getServer(req, res, next) {
  try {
    const server = await getServerRow(req.params.serverId, req.user.id);

    if (!server) {
      return res.status(404).json({ message: "Сервер не найден или недоступен." });
    }

    return res.json({
      server: normalizeServer(server)
    });
  } catch (error) {
    return next(error);
  }
}

export async function createServer(req, res, next) {
  const name = normalizeServerName(req.body.name);
  const nameError = validateServerName(name);

  if (nameError) {
    return res.status(400).json({ message: nameError });
  }

  const icon = normalizeServerIcon(req.body.icon, name);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const serverResult = await client.query(
      `
        INSERT INTO servers (name, icon, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [name, icon, req.user.id]
    );

    const serverId = serverResult.rows[0].id;

    await client.query(
      `
        INSERT INTO server_members (server_id, user_id, role)
        VALUES ($1, $2, 'owner')
      `,
      [serverId, req.user.id]
    );

    await client.query(
      `
        INSERT INTO channels (server_id, name, type, owner_id)
        VALUES ($1, 'general', 'text', $2)
      `,
      [serverId, req.user.id]
    );

    await client.query("COMMIT");

    const server = await getServerRow(serverId, req.user.id);

    return res.status(201).json({
      server: normalizeServer(server)
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (error.code === "23505") {
      return res.status(409).json({ message: "Такой объект уже существует." });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function updateServer(req, res, next) {
  try {
    const access = await ensureServerOwner(req.params.serverId, req.user.id, res);

    if (!access) {
      return null;
    }

    const updates = [];
    const values = [];

    if (typeof req.body.name === "string") {
      const name = normalizeServerName(req.body.name);
      const nameError = validateServerName(name);

      if (nameError) {
        return res.status(400).json({ message: nameError });
      }

      values.push(name);
      updates.push(`name = $${values.length}`);
    }

    if (typeof req.body.icon === "string") {
      values.push(normalizeServerIcon(req.body.icon, req.body.name || "S"));
      updates.push(`icon = $${values.length}`);
    }

    if (updates.length > 0) {
      values.push(req.params.serverId);

      await query(
        `
          UPDATE servers
          SET ${updates.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
        `,
        values
      );
    }

    const server = await getServerRow(req.params.serverId, req.user.id);

    return res.json({
      server: normalizeServer(server)
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteServer(req, res, next) {
  try {
    const access = await ensureServerOwner(req.params.serverId, req.user.id, res);

    if (!access) {
      return null;
    }

    await query("DELETE FROM servers WHERE id = $1", [req.params.serverId]);

    return res.json({
      success: true
    });
  } catch (error) {
    return next(error);
  }
}

export async function createChannel(req, res, next) {
  try {
    const access = await ensureServerOwner(req.params.serverId, req.user.id, res);

    if (!access) {
      return null;
    }

    const name = normalizeChannelName(req.body.name);
    const nameError = validateChannelName(name);

    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const result = await query(
      `
        INSERT INTO channels (
          server_id,
          name,
          type,
          owner_id,
          is_private,
          allowed_members,
          allowed_roles
        )
        VALUES ($1, $2, 'text', $3, $4, $5::jsonb, $6::jsonb)
        RETURNING
          id,
          server_id,
          name,
          type,
          owner_id,
          is_private,
          allowed_members,
          allowed_roles,
          created_at,
          updated_at
      `,
      [
        req.params.serverId,
        name,
        req.user.id,
        Boolean(req.body.isPrivate),
        JSON.stringify(normalizeStringArray(req.body.allowedMembers)),
        JSON.stringify(normalizeStringArray(req.body.allowedRoles))
      ]
    );

    return res.status(201).json({
      channel: normalizeServer({ channels: [result.rows[0]] }).channels[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Канал с таким названием уже существует." });
    }

    return next(error);
  }
}

export async function updateChannel(req, res, next) {
  try {
    const access = await ensureServerOwner(req.params.serverId, req.user.id, res);

    if (!access) {
      return null;
    }

    const updates = [];
    const values = [];

    if (typeof req.body.name === "string") {
      const name = normalizeChannelName(req.body.name);
      const nameError = validateChannelName(name);

      if (nameError) {
        return res.status(400).json({ message: nameError });
      }

      values.push(name);
      updates.push(`name = $${values.length}`);
    }

    if (typeof req.body.isPrivate === "boolean") {
      values.push(req.body.isPrivate);
      updates.push(`is_private = $${values.length}`);
    }

    if (Array.isArray(req.body.allowedMembers)) {
      values.push(JSON.stringify(normalizeStringArray(req.body.allowedMembers)));
      updates.push(`allowed_members = $${values.length}::jsonb`);
    }

    if (Array.isArray(req.body.allowedRoles)) {
      values.push(JSON.stringify(normalizeStringArray(req.body.allowedRoles)));
      updates.push(`allowed_roles = $${values.length}::jsonb`);
    }

    if (updates.length === 0) {
      const server = await getServerRow(req.params.serverId, req.user.id);
      const channel = normalizeServer(server).channels.find((item) => item.id === req.params.channelId);

      if (!channel) {
        return res.status(404).json({ message: "Канал не найден." });
      }

      return res.json({ channel });
    }

    values.push(req.params.serverId);
    values.push(req.params.channelId);

    const result = await query(
      `
        UPDATE channels
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE server_id = $${values.length - 1}
          AND id = $${values.length}
        RETURNING
          id,
          server_id,
          name,
          type,
          owner_id,
          is_private,
          allowed_members,
          allowed_roles,
          created_at,
          updated_at
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Канал не найден." });
    }

    return res.json({
      channel: normalizeServer({ channels: [result.rows[0]] }).channels[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Канал с таким названием уже существует." });
    }

    return next(error);
  }
}

export async function deleteChannel(req, res, next) {
  try {
    const access = await ensureServerOwner(req.params.serverId, req.user.id, res);

    if (!access) {
      return null;
    }

    const countResult = await query(
      "SELECT COUNT(*)::int AS count FROM channels WHERE server_id = $1",
      [req.params.serverId]
    );

    if (countResult.rows[0].count <= 1) {
      return res.status(400).json({ message: "Нельзя удалить последний канал сервера." });
    }

    const result = await query(
      "DELETE FROM channels WHERE server_id = $1 AND id = $2 RETURNING id",
      [req.params.serverId, req.params.channelId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Канал не найден." });
    }

    return res.json({
      success: true
    });
  } catch (error) {
    return next(error);
  }
}