import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { BookingSchema } from "@/features/booking/booking.schema";
import { apiError, apiSuccess } from "@/lib/http";

export async function POST(request: Request) {
  const auth = await requireRole(["student"]);
  if (auth.error) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid booking details.", 422);

  const supabase = await createClient();

  // Ownership is checked server-side; RLS is an additional enforcement layer.
  const { data: project } = await supabase.from("projects")
    .select("id").eq("id", parsed.data.projectId)
    .eq("student_id", auth.context.userId).maybeSingle();
  if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);

  const { data: equipment } = await supabase.from("equipment")
    .select("id,status").eq("id", parsed.data.equipmentId).maybeSingle();
  if (!equipment || equipment.status !== "active") {
    return apiError("EQUIPMENT_UNAVAILABLE", "This equipment is not available for booking.", 409);
  }

  const { data, error } = await supabase.from("bookings").insert({
    student_id: auth.context.userId,
    equipment_id: parsed.data.equipmentId,
    project_id: parsed.data.projectId,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    status: "pending"
  }).select("id,status,start_time,end_time").single();

  if (error) return apiError("BOOKING_CREATE_FAILED", "Unable to submit booking request.", 409);
  return apiSuccess(data, 201);
}
