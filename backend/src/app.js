import express from "express";
import cors from "cors";
import { env, isAllowedClientOrigin } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { serversRouter } from "./routes/servers.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedClientOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/servers", serversRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден."
  });
});

app.use(errorHandler);