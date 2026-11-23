import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { ProjectSchema } from "@/features/projects/project.schema";
import { apiError, apiSuccess } from "@/lib/http";

export async function POST(request: Request) {
  const auth = await requireRole(["student"]);
  if (auth.error) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const parsed = ProjectSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Please provide valid project details.", 422);

  const supabase = await createClient();
  const { data, error } = await supabase.from("projects")
    .insert({ ...parsed.data, student_id: auth.context.userId })
    .select("id,title,description,requirements,deadline,created_at")
    .single();

  if (error) return apiError("PROJECT_CREATE_FAILED", "Unable to create project.", 400);
  return apiSuccess(data, 201);
}
