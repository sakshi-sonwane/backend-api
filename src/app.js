import crypto from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";

const app = express();

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

app.use(helmet());
app.use(cors({ origin: env.APP_ORIGIN }));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
