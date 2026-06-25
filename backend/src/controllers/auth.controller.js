import { query } from "../db/pool.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { createToken } from "../utils/createToken.js";
import { normalizeUser } from "../utils/normalizeUser.js";

export async function register(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (username.length < 3) {
      return res.status(400).json({
        message: "Имя пользователя должно быть минимум 3 символа."
      });
    }

    if (username.length > 32) {
      return res.status(400).json({
        message: "Имя пользователя должно быть максимум 32 символа."
      });
    }

    if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) {
      return res.status(400).json({
        message: "В имени можно использовать буквы, цифры, точку, нижнее подчёркивание и дефис."
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        message: "Пароль должен быть минимум 4 символа."
      });
    }

    const existingUser = await query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Пользователь с таким именем уже существует."
      });
    }

    const passwordHash = await hashPassword(password);
    const avatar = username[0].toUpperCase();

    const result = await query(
      `
        INSERT INTO users (username, password_hash, avatar)
        VALUES ($1, $2, $3)
        RETURNING id, username, avatar, status, bio, created_at, updated_at
      `,
      [username, passwordHash, avatar]
    );

    const user = normalizeUser(result.rows[0]);
    const token = createToken(user);

    return res.status(201).json({
      user,
      token
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    const result = await query(
      `
        SELECT id, username, password_hash, avatar, status, bio, created_at, updated_at
        FROM users
        WHERE LOWER(username) = LOWER($1)
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Неверный логин или пароль."
      });
    }

    const row = result.rows[0];
    const isPasswordValid = await comparePassword(password, row.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Неверный логин или пароль."
      });
    }

    const user = normalizeUser(row);
    const token = createToken(user);

    return res.json({
      user,
      token
    });
  } catch (error) {
    return next(error);
  }
}

export async function checkToken(req, res) {
  return res.json({
    valid: true,
    user: req.user
  });
}