import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/http";
import { isDemoModeEnabled, verifyToken, DEMO_COOKIE_NAME } from "./demo-session";

export type AppRole =
  | "student"
  | "faculty"
  | "technician"
  | "lab_admin"
  | "admin"
  | "hod"
  | "management";

export type AuthContext = { userId: string; role: AppRole; departmentId: string | null };

export function rolesMatch(required: AppRole[], actual: AppRole): boolean {
  if (required.includes(actual)) return true;
  if (required.includes("admin") && actual === "lab_admin") return true;
  if (required.includes("lab_admin") && actual === "admin") return true;
  return false;
}

export async function getAuthContext(): Promise<
  { context: AuthContext; error?: never } | { context?: never; error: ReturnType<typeof apiError> }
> {
  // 1. Check server-side demo session cookie when DEMO_MODE is active
  if (isDemoModeEnabled()) {
    try {
      const cookieStore = await cookies();
      const demoCookie = cookieStore.get(DEMO_COOKIE_NAME)?.value;
      if (demoCookie) {
        const payload = verifyToken(demoCookie);
        if (payload) {
          return {
            context: {
              userId: payload.sub,
              role: payload.role as AppRole,
              departmentId: payload.deptId
            }
          };
        }
      }
    } catch {
      // In non-request environments (e.g. testing without cookies mocked), proceed to Supabase fallback
    }
  }

  // 2. Production fallback: Supabase server auth
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: apiError("UNAUTHENTICATED", "Please sign in.", 401) };

    const { data: profile, error } = await supabase
      .from("profiles").select("role,department_id").eq("id", user.id).single();

    if (error || !profile) return { error: apiError("PROFILE_NOT_FOUND", "Your account profile is not configured.", 403) };
    const role = profile.role as AppRole;
    if (!["student", "faculty", "technician", "lab_admin", "admin", "hod", "management"].includes(role)) {
      return { error: apiError("INVALID_ROLE", "Your account role is invalid.", 403) };
    }
    return { context: { userId: user.id, role, departmentId: profile.department_id } };
  } catch {
    return { error: apiError("UNAUTHENTICATED", "Please sign in.", 401) };
  }
}

export async function requireRole(roles: AppRole[]) {
  const result = await getAuthContext();
  if (result.error) return result;
  if (!rolesMatch(roles, result.context.role)) {
    return { error: apiError("FORBIDDEN", "You do not have permission for this operation.", 403) } as const;
  }
  return result;
}
