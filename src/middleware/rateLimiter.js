import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

const handler = (req, res) => {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Try sometime later",
    },
  });
};

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  handler,
});
