import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/http";

export type AppRole = "student" | "faculty" | "admin";
export type AuthContext = { userId: string; role: AppRole; departmentId: string | null };

export async function getAuthContext(): Promise<
  { context: AuthContext; error?: never } | { context?: never; error: ReturnType<typeof apiError> }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: apiError("UNAUTHENTICATED", "Please sign in.", 401) };

  const { data: profile, error } = await supabase
    .from("profiles").select("role,department_id").eq("id", user.id).single();

  if (error || !profile) return { error: apiError("PROFILE_NOT_FOUND", "Your account profile is not configured.", 403) };
  const role = profile.role as AppRole;
  if (!["student", "faculty", "admin"].includes(role)) {
    return { error: apiError("INVALID_ROLE", "Your account role is invalid.", 403) };
  }
  return { context: { userId: user.id, role, departmentId: profile.department_id } };
}

export async function requireRole(roles: AppRole[]) {
  const result = await getAuthContext();
  if (result.error) return result;
  if (!roles.includes(result.context.role)) {
    return { error: apiError("FORBIDDEN", "You do not have permission for this operation.", 403) } as const;
  }
  return result;
}
