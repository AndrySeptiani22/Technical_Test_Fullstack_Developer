import express from "express";
import dataSource from "@infrastructure/config/db-context";
import { Role } from "@domain/entities";

const router = express.Router();

router.get("/health", async (_req, res) => {
  try {
    await dataSource.getRepository(Role).count();
    res.status(200).json({
      status: "ok",
      checks: { database: "ok" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check database query failed.", error);
    res.status(503).json({
      status: "error",
      checks: { database: "error" },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
