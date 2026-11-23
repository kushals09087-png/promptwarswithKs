import { cookies } from "next/headers";
import { z } from "zod";
import { PersonaIdSchema, PERSONAS_BY_ID } from "@/lib/auth/roles";
import {
  isDemoModeEnabled,
  createDemoSession,
  verifyToken,
  checkDemoRateLimit,
  DEMO_COOKIE_NAME
} from "@/lib/auth/demo-session";
import { apiError, apiSuccess } from "@/lib/http";

const SwitchPersonaSchema = z.object({
  personaId: PersonaIdSchema
});

// POST /api/demo/session - Authenticates as one of the 6 seeded personas
export async function POST(request: Request) {
  // 1. DEMO_MODE Gate: If false, route returns 404
  if (!isDemoModeEnabled()) {
    return apiError("NOT_FOUND", "Demo mode is disabled on this environment.", 404);
  }

  // 2. Rate limiting per client IP
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-evaluator";
  const rateLimit = checkDemoRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMIT_EXCEEDED", "Too many persona switches. Please wait a moment.", 429);
  }

  // 3. Request body validation with Zod
  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = SwitchPersonaSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid or unknown personaId. Must be one of the 6 seeded accounts.", 422);
  }

  const { personaId } = parsed.data;

  // 4. Create cryptographically signed demo session token
  try {
    const { token, persona } = createDemoSession(personaId);

    // 5. Set httpOnly, secure, SameSite=Lax cookie
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return apiSuccess({
      activePersona: {
        id: persona.id,
        name: persona.name,
        role: persona.role,
        roleLabel: persona.roleLabel,
        roleTitle: persona.roleTitle,
        department: persona.department,
        avatar: persona.avatar,
        badge: persona.badge,
        email: persona.email
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to switch persona";
    return apiError("SESSION_CREATION_FAILED", msg, 500);
  }
}

// GET /api/demo/session - Restores active persona from server session cookie
export async function GET() {
  if (!isDemoModeEnabled()) {
    return apiError("NOT_FOUND", "Demo mode is disabled.", 404);
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEMO_COOKIE_NAME)?.value;
    if (!token) {
      return apiSuccess({ activePersona: null });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return apiSuccess({ activePersona: null });
    }

    const persona = PERSONAS_BY_ID[payload.sub];
    if (!persona) {
      return apiSuccess({ activePersona: null });
    }

    return apiSuccess({
      activePersona: {
        id: persona.id,
        name: persona.name,
        role: persona.role,
        roleLabel: persona.roleLabel,
        roleTitle: persona.roleTitle,
        department: persona.department,
        avatar: persona.avatar,
        badge: persona.badge,
        email: persona.email
      }
    });
  } catch {
    return apiSuccess({ activePersona: null });
  }
}

// DELETE /api/demo/session - Logs out of demo session
export async function DELETE() {
  if (!isDemoModeEnabled()) {
    return apiError("NOT_FOUND", "Demo mode is disabled.", 404);
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
  return apiSuccess({ message: "Demo session cleared." });
}
