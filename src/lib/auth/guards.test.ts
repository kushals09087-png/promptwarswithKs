import { describe, it, expect, vi, beforeEach } from "vitest";
import { rolesMatch, requireRole, getAuthContext } from "./guards";
import { createDemoSession } from "./demo-session";
import { apiError, apiSuccess } from "../http";

// Mock next/headers
const mockGetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockGetCookie
  }))
}));

describe("HTTP Helper Utilities", () => {
  it("formats standard error response", async () => {
    const res = apiError("FORBIDDEN", "Not allowed", 403);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "FORBIDDEN", message: "Not allowed" }
    });
  });

  it("formats standard success response", async () => {
    const res = apiSuccess({ hello: "world" }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: { hello: "world" }
    });
  });
});

describe("Auth Guards & Context Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_MODE = "true";
  });

  it("resolves student auth context from valid demo token", async () => {
    const session = createDemoSession("user-stu-01");
    mockGetCookie.mockReturnValue({ value: session.token });

    const result = await getAuthContext();
    expect(result.error).toBeUndefined();
    expect("context" in result).toBe(true);
    if ("context" in result && result.context) {
      expect(result.context.userId).toBe("user-stu-01");
      expect(result.context.role).toBe("student");
    }
  });

  it("resolves faculty auth context from valid demo token", async () => {
    const session = createDemoSession("user-fac-01");
    mockGetCookie.mockReturnValue({ value: session.token });

    const result = await getAuthContext();
    expect(result.error).toBeUndefined();
    expect("context" in result).toBe(true);
    if ("context" in result && result.context) {
      expect(result.context.role).toBe("faculty");
    }
  });

  it("enforces requireRole matching allowed roles", async () => {
    const session = createDemoSession("user-fac-01");
    mockGetCookie.mockReturnValue({ value: session.token });

    const allowed = await requireRole(["faculty", "lab_admin"]);
    expect(allowed.error).toBeUndefined();
    expect("context" in allowed).toBe(true);
    if ("context" in allowed && allowed.context) {
      expect(allowed.context.role).toBe("faculty");
    }
  });

  it("denies access with 403 FORBIDDEN when user role is not authorized", async () => {
    const session = createDemoSession("user-stu-01"); // student
    mockGetCookie.mockReturnValue({ value: session.token });

    const result = await requireRole(["faculty", "lab_admin"]);
    expect("context" in result).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(403);

    const body = await result.error!.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("denies access with 401 when no demo cookie is present and no auth user", async () => {
    mockGetCookie.mockReturnValue(undefined);

    const result = await getAuthContext();
    expect("context" in result).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe(401);
  });

  it("denies access when demo cookie has forged signature", async () => {
    const session = createDemoSession("user-stu-01");
    mockGetCookie.mockReturnValue({ value: `${session.token}_tampered` });

    const result = await getAuthContext();
    expect("context" in result).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("matches admin and lab_admin interchangeably", () => {
    expect(rolesMatch(["admin"], "lab_admin")).toBe(true);
    expect(rolesMatch(["lab_admin"], "admin")).toBe(true);
    expect(rolesMatch(["student"], "faculty")).toBe(false);
  });
});
