import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    email: z.string().trim().toLowerCase().email("invalid email"),
    password: z.string().min(8, "password must be minimum of 8 chars").max(128),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("invalid email"),
    password: z.string().min(1, "password must be minimum of 8 chars").max(128),
  })
  .strict();
