import { z } from "zod";

export const BookingSchema = z.object({
  equipmentId: z.string().uuid(),
  projectId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true })
}).refine(v => new Date(v.startTime) < new Date(v.endTime), {
  message: "End time must be after start time.", path: ["endTime"]
});
export type BookingInput = z.infer<typeof BookingSchema>;
