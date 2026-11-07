import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().toLowerCase().email("invalid email"),
  userPwd: z.string().min(6, "password must be minimum of 6 chars").trim(),
}).strict()
