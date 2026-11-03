import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";

const app = express();

app.use((req, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// common middleware
app.use(express.json({ limit: "16kb" }));
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
  }),
);
app.use(helmet());

app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok" } }));

app.use(notFound);
app.use(errorHandler);

export { app };
