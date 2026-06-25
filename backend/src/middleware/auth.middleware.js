import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { normalizeUser } from "../utils/normalizeUser.js";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Нужна авторизация. Передай JWT в заголовке Authorization: Bearer <token>."
    });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload?.userId) {
      return res.status(401).json({
        message: "Некорректный токен."
      });
    }

    const result = await query(
      `
        SELECT id, username, avatar, status, bio, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Пользователь токена больше не существует."
      });
    }

    req.user = normalizeUser(result.rows[0]);
    req.auth = {
      userId: req.user.id,
      tokenPayload: payload
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Срок действия токена истёк. Нужно войти снова."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Некорректный токен."
      });
    }

    return next(error);
  }
}