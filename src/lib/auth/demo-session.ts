import crypto from "crypto";
import { PERSONAS_BY_ID, UserPersona, RoleKey } from "./roles";

export const DEMO_COOKIE_NAME = "lablink_demo_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEMO_SECRET = process.env.DEMO_SESSION_SECRET || "lablink-nexus-demo-hmac-sha256-key-2026";

export interface DemoSessionPayload {
  sub: string; // persona id (e.g. user-stu-01)
  role: RoleKey;
  deptId: string | null;
  name: string;
  iat: number;
  exp: number;
}

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE !== "false";
}

// In-memory sliding window rate limiter: max 40 persona switches per minute per identifier
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkDemoRateLimit(identifier: string, limit = 40, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// Sign payload using HMAC SHA-256
export function signToken(payload: DemoSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", DEMO_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

// Verify token signature and expiration
export function verifyToken(token: string): DemoSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", DEMO_SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as DemoSessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Create verified session for persona
export function createDemoSession(personaId: string): { token: string; persona: UserPersona; payload: DemoSessionPayload } {
  const persona = PERSONAS_BY_ID[personaId];
  if (!persona) {
    throw new Error(`Unknown personaId: ${personaId}`);
  }

  const now = Date.now();
  const payload: DemoSessionPayload = {
    sub: persona.id,
    role: persona.role,
    deptId: persona.departmentId || null,
    name: persona.name,
    iat: now,
    exp: now + SESSION_TTL_MS
  };

  const token = signToken(payload);
  logAuditTrail(persona.id, persona.role);
  return { token, persona, payload };
}

// Audit trail logging without exposing PII beyond persona ID and role
export function logAuditTrail(personaId: string, role: string, action = "PERSONA_SWITCH") {
  const timestamp = new Date().toISOString();
  // Safe audit log without user PII
  console.info(`[AUDIT] timestamp="${timestamp}" action="${action}" persona_id="${personaId}" role="${role}"`);
}
