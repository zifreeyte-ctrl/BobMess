import { query } from "../db/pool.js";
import { normalizeUser } from "../utils/normalizeUser.js";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

function validateUsername(username) {
  if (username.length < 3) {
    return "Имя пользователя должно быть минимум 3 символа.";
  }

  if (username.length > 32) {
    return "Имя пользователя должно быть максимум 32 символа.";
  }

  if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) {
    return "В имени можно использовать буквы, цифры, точку, нижнее подчёркивание и дефис.";
  }

  return null;
}

export async function getMe(req, res) {
  return res.json({
    user: req.user
  });
}

export async function updateMe(req, res, next) {
  try {
    const updates = [];
    const values = [];

    const username = normalizeOptionalString(req.body.username);
    const avatar = typeof req.body.avatar === "string" ? req.body.avatar.trim() : null;
    const status = normalizeOptionalString(req.body.status);
    const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : null;

    if (username !== null) {
      const usernameError = validateUsername(username);

      if (usernameError) {
        return res.status(400).json({ message: usernameError });
      }

      const existingUser = await query(
        `
          SELECT id
          FROM users
          WHERE LOWER(username) = LOWER($1)
            AND id <> $2
        `,
        [username, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message: "Пользователь с таким именем уже существует."
        });
      }

      values.push(username);
      updates.push(`username = $${values.length}`);
    }

    if (avatar !== null) {
      if (avatar.length > 700000) {
        return res.status(400).json({
          message: "Аватар слишком большой. На backend MVP максимум 700 KB."
        });
      }

      values.push(avatar || null);
      updates.push(`avatar = $${values.length}`);
    }

    if (status !== null) {
      if (status.length > 32) {
        return res.status(400).json({
          message: "Статус должен быть максимум 32 символа."
        });
      }

      values.push(status || "online");
      updates.push(`status = $${values.length}`);
    }

    if (bio !== null) {
      if (bio.length > 160) {
        return res.status(400).json({
          message: "Описание профиля должно быть максимум 160 символов."
        });
      }

      values.push(bio);
      updates.push(`bio = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.json({
        user: req.user
      });
    }

    values.push(req.user.id);

    const result = await query(
      `
        UPDATE users
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, username, avatar, status, bio, created_at, updated_at
      `,
      values
    );

    return res.json({
      user: normalizeUser(result.rows[0])
    });
  } catch (error) {
    return next(error);
  }
}