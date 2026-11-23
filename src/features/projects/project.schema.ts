import { z } from "zod";

export const ProjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(3000),
  requirements: z.string().trim().min(3).max(2000),
  deadline: z.string().date()
});
