import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import authRouter from "./routes/user.route.js";

const app = express();


// deploy krne se pehle uncomment krlena
// if (env.NODE_ENV === "production") {
//   app.set("trust proxy", 1);
// }

app.use((req, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));

app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok" } }));

app.use("/api/v1/auth", authRouter);

import projectRouter from "./routes/user.route.js";

app.use("/api/v1/projects",projectRouter)

app.use(notFound);
app.use(errorHandler);

export { app };
