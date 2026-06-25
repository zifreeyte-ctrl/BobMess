import { Router } from "express";
import { query } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (req, res, next) => {
  try {
    await query("SELECT 1");

    res.json({
      status: "ok",
      service: "BobMess API",
      database: "connected",
      time: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});