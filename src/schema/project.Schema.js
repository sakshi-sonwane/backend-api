import { z } from "zod";

export const zodProjectSchema = z
  .object({
    projectName: z.string().trim().min(1).max(100),
    projectDescription: z.string().trim().max(1000).optional(),
  })
  .strict();

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateProjectSchema = z
  .object({
    projectName: z.string().trim().min(1).max(100).optional(),
    projectDescription: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required",
  });
