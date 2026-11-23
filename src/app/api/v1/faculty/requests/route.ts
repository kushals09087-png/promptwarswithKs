import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { apiError, apiSuccess } from "@/lib/http";

export async function GET() {
  const auth = await requireRole(["faculty", "admin"]);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  let query = supabase.from("bookings")
    .select("id,status,start_time,end_time,student_id,equipment_id,project_id,equipment(name,department_id),projects(title,description,deadline)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (auth.context.role === "faculty" && auth.context.departmentId) {
    // Department scoping is also enforced by RLS. This join filter narrows the dashboard query.
    query = query.eq("equipment.department_id", auth.context.departmentId);
  }

  const { data, error } = await query;
  if (error) return apiError("REQUESTS_QUERY_FAILED", "Unable to load pending requests.", 500);
  return apiSuccess(data ?? []);
}
