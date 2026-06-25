import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}