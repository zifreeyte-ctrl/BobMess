import { Router } from "express";
import { getMe, updateMe } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, getMe);
usersRouter.patch("/me", requireAuth, updateMe);