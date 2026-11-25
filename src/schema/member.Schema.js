import { z } from "zod";

export const addMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
  })
  .strict();
