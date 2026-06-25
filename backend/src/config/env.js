import dotenv from "dotenv";

dotenv.config();

function parseClientOrigins() {
  const rawOrigins =
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5500,http://localhost:3001,http://127.0.0.1:3001";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT || 4000),

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientOrigins: parseClientOrigins()
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

export function isDevelopmentOrigin(origin) {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (hostname === "localhost") {
      return true;
    }

    if (hostname === "127.0.0.1") {
      return true;
    }

    if (hostname === "[::1]" || hostname === "::1") {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

export function isAllowedClientOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (env.clientOrigins.includes(origin)) {
    return true;
  }

  if (env.nodeEnv !== "production" && isDevelopmentOrigin(origin)) {
    return true;
  }

  return false;
}