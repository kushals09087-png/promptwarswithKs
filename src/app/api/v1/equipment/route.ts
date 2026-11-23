import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { apiError, apiSuccess } from "@/lib/http";

export async function GET(request: Request) {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const departmentId = url.searchParams.get("departmentId");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));

  const supabase = await createClient();
  let query = supabase.from("equipment")
    .select("id,name,description,specifications,location,status,department_id,departments(name)")
    .neq("status", "unavailable")
    .order("name")
    .limit(limit);

  if (q) query = query.ilike("name", `%${q.replace(/[%_,]/g, "")}%`);
  if (departmentId) query = query.eq("department_id", departmentId);

  const { data, error } = await query;
  if (error) return apiError("EQUIPMENT_QUERY_FAILED", "Unable to load equipment.", 500);
  return apiSuccess(data ?? []);
}
