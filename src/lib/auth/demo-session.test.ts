import { describe, it, expect, beforeEach } from "vitest";
import {
  SIX_PERSONAS,
  PERSONAS_BY_ID,
  PersonaIdList,
  PersonaSchema,
  RoleKeySchema
} from "@/lib/auth/roles";
import {
  createDemoSession,
  verifyToken,
  checkDemoRateLimit,
  isDemoModeEnabled
} from "@/lib/auth/demo-session";
import { rolesMatch } from "@/lib/auth/guards";
import {
  registerFormDirty,
  clearAllUnsavedForms,
  getUnsavedFormsList
} from "@/lib/hooks/useUnsavedChanges";

describe("Demo Personas & Role Schemas", () => {
  it("defines exactly 6 canonical stakeholder personas", () => {
    expect(SIX_PERSONAS).toHaveLength(6);
  });

  it("validates all 6 personas against PersonaSchema", () => {
    for (const persona of SIX_PERSONAS) {
      const parsed = PersonaSchema.safeParse(persona);
      expect(parsed.success).toBe(true);
      expect(persona.id).toBeTruthy();
      expect(persona.name).toBeTruthy();
      expect(persona.email).toContain("@campus.edu");
    }
  });

  it("contains unique IDs across all personas", () => {
    const ids = SIX_PERSONAS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
    expect(PersonaIdList).toHaveLength(6);
  });

  it("maps each ID accurately in PERSONAS_BY_ID", () => {
    for (const id of PersonaIdList) {
      const persona = PERSONAS_BY_ID[id];
      expect(persona).toBeDefined();
      expect(persona.id).toBe(id);
    }
  });

  it("verifies all expected roles in RoleKeySchema", () => {
    const validRoles = ["student", "faculty", "technician", "lab_admin", "admin", "hod", "management"];
    for (const role of validRoles) {
      expect(RoleKeySchema.safeParse(role).success).toBe(true);
    }
    expect(RoleKeySchema.safeParse("unknown_role").success).toBe(false);
  });
});

describe("Cryptographic Demo Session Tokens", () => {
  it("creates a signed demo session for a valid persona ID", () => {
    const session = createDemoSession("user-stu-01");
    expect(session.token).toBeTruthy();
    expect(session.persona.name).toBe("Alex Kumar");
    expect(session.persona.role).toBe("student");
  });

  it("verifies and decodes a signed token", () => {
    const session = createDemoSession("user-fac-01");
    const payload = verifyToken(session.token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-fac-01");
    expect(payload?.role).toBe("faculty");
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it("rejects tampered tokens with altered payloads or signatures", () => {
    const session = createDemoSession("user-stu-01");
    const parts = session.token.split(".");
    expect(parts).toHaveLength(2);

    // Tamper with payload (alter role to admin)
    const originalPayload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
    originalPayload.role = "admin";
    const forgedPayloadStr = Buffer.from(JSON.stringify(originalPayload)).toString("base64url");
    const forgedToken = `${forgedPayloadStr}.${parts[1]}`;

    const verified = verifyToken(forgedToken);
    expect(verified).toBeNull();
  });

  it("rejects tokens with forged or corrupted signatures", () => {
    const session = createDemoSession("user-tech-01");
    const parts = session.token.split(".");
    const corruptedToken = `${parts[0]}.invalid_signature_xyz`;

    expect(verifyToken(corruptedToken)).toBeNull();
  });

  it("throws when creating demo session with invalid persona ID", () => {
    expect(() => createDemoSession("user-hacker-999" as unknown as (typeof PersonaIdList)[number])).toThrow();
  });
});

describe("Demo Rate Limiting", () => {
  it("permits initial requests and tracks window count", () => {
    const ip = `test-evaluator-${Date.now()}`;
    const result1 = checkDemoRateLimit(ip);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(39);
  });

  it("throttles when rate limit threshold (40) is reached", () => {
    const ip = `flood-evaluator-${Date.now()}`;
    for (let i = 0; i < 40; i++) {
      checkDemoRateLimit(ip);
    }
    const throttled = checkDemoRateLimit(ip);
    expect(throttled.allowed).toBe(false);
    expect(throttled.remaining).toBe(0);
  });
});

describe("Role Matching and Hierarchy Guards", () => {
  it("matches identical roles", () => {
    expect(rolesMatch(["student"], "student")).toBe(true);
    expect(rolesMatch(["faculty"], "faculty")).toBe(true);
  });

  it("supports canonical lab_admin and legacy admin alias interchangeably", () => {
    expect(rolesMatch(["admin"], "lab_admin")).toBe(true);
    expect(rolesMatch(["lab_admin"], "admin")).toBe(true);
  });

  it("distinguishes separate stakeholder domains", () => {
    expect(rolesMatch(["student"], "faculty")).toBe(false);
    expect(rolesMatch(["technician"], "management")).toBe(false);
    expect(rolesMatch(["hod"], "student")).toBe(false);
  });
});

describe("Unsaved Changes Form Tracking Registry", () => {
  beforeEach(() => {
    clearAllUnsavedForms();
  });

  it("registers dirty forms and returns them in unsaved list", () => {
    expect(getUnsavedFormsList()).toEqual([]);

    registerFormDirty("form-booking", "Equipment Booking Form", true);
    expect(getUnsavedFormsList()).toEqual(["Equipment Booking Form"]);

    registerFormDirty("form-project", "Academic Project Registration", true);
    expect(getUnsavedFormsList()).toHaveLength(2);
    expect(getUnsavedFormsList()).toContain("Equipment Booking Form");
    expect(getUnsavedFormsList()).toContain("Academic Project Registration");
  });

  it("unregisters clean forms", () => {
    registerFormDirty("form-booking", "Equipment Booking Form", true);
    expect(getUnsavedFormsList()).toHaveLength(1);

    registerFormDirty("form-booking", "Equipment Booking Form", false);
    expect(getUnsavedFormsList()).toHaveLength(0);
  });

  it("clears all unsaved forms on reset", () => {
    registerFormDirty("f1", "Form 1", true);
    registerFormDirty("f2", "Form 2", true);
    expect(getUnsavedFormsList()).toHaveLength(2);

    clearAllUnsavedForms();
    expect(getUnsavedFormsList()).toHaveLength(0);
  });
});

describe("Feature Flag DEMO_MODE", () => {
  it("recognizes DEMO_MODE toggle accurately", () => {
    const original = process.env.DEMO_MODE;
    process.env.DEMO_MODE = "false";
    expect(isDemoModeEnabled()).toBe(false);
    process.env.DEMO_MODE = "true";
    expect(isDemoModeEnabled()).toBe(true);
    process.env.DEMO_MODE = original;
  });
});
