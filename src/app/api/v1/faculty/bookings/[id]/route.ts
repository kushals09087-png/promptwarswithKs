import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { apiError, apiSuccess } from "@/lib/http";

const DecisionSchema = z.object({ decision: z.enum(["approved", "rejected"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["faculty", "admin"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = DecisionSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Decision must be approved or rejected.", 422);

  const supabase = await createClient();
  const { data: booking, error: readError } = await supabase.from("bookings")
    .select("id,status,equipment_id,equipment(department_id)")
    .eq("id", id).single();

  if (readError || !booking) return apiError("BOOKING_NOT_FOUND", "Booking not found.", 404);
  if (booking.status !== "pending") return apiError("INVALID_STATE", "Only pending requests can be decided.", 409);

  const equipment = booking.equipment as unknown as { department_id: string };
  if (auth.context.role === "faculty" && equipment.department_id !== auth.context.departmentId) {
    return apiError("FORBIDDEN", "You can only review requests for your department.", 403);
  }

  const { data, error } = await supabase.from("bookings").update({
    status: parsed.data.decision,
    approved_by: auth.context.userId
  }).eq("id", id).eq("status", "pending")
    .select("id,status,approved_by").single();

  if (error) {
    const isConflict = error.code === "23P01";
    return apiError(isConflict ? "BOOKING_CONFLICT" : "DECISION_FAILED",
      isConflict ? "Another approved booking occupies this time slot." : "Unable to update booking.", isConflict ? 409 : 400);
  }
  return apiSuccess(data);
}
