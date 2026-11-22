import { z } from "zod";

export const registerSchema = z
  .object({
    userName: z.string().trim().min(1, "name is required").max(100),
    userEmail: z.string().trim().toLowerCase().email("invalid email"),
    password: z
      .string()
      .min(8, "password must be minimum of 8 chars")
      .max(128)
      .regex(/[A-Za-z]/, "password must contain a letter")
      .regex(/[0-9]/, "password must contain a number"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("invalid email"),
    password: z.string().min(1, "password is required").max(128),
  })
  .strict();
