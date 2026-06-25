import { Router } from "express";
import {
  createChannel,
  createServer,
  deleteChannel,
  deleteServer,
  getServer,
  listServers,
  updateChannel,
  updateServer
} from "../controllers/servers.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const serversRouter = Router();

serversRouter.use(requireAuth);

serversRouter.get("/", listServers);
serversRouter.post("/", createServer);
serversRouter.get("/:serverId", getServer);
serversRouter.patch("/:serverId", updateServer);
serversRouter.delete("/:serverId", deleteServer);

serversRouter.post("/:serverId/channels", createChannel);
serversRouter.patch("/:serverId/channels/:channelId", updateChannel);
serversRouter.delete("/:serverId/channels/:channelId", deleteChannel);