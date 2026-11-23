import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as demoSessionPOST, GET as demoSessionGET, DELETE as demoSessionDELETE } from "@/app/api/demo/session/route";
import { GET as facultyRequestsGET } from "@/app/api/v1/faculty/requests/route";
import { PATCH as facultyBookingDecisionPATCH } from "@/app/api/v1/faculty/bookings/[id]/route";
import { POST as studentBookingPOST } from "@/app/api/v1/bookings/route";
import { POST as aiRecommendationsPOST } from "@/app/api/v1/ai/recommendations/route";
import { createDemoSession } from "@/lib/auth/demo-session";

// Mock next/headers
const mockCookieMap = new Map<string, string>();
const mockCookieStore = {
  get: vi.fn((key: string) => {
    const val = mockCookieMap.get(key);
    return val ? { value: val } : undefined;
  }),
  set: vi.fn((key: string, val: string) => {
    mockCookieMap.set(key, val);
  }),
  delete: vi.fn((key: string) => {
    mockCookieMap.delete(key);
  })
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore)
}));

describe("Demo Session API Security & Functionality (/api/demo/session)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieMap.clear();
    process.env.DEMO_MODE = "true";
  });

  it("authenticates as a valid persona and returns active persona details", async () => {
    const req = new Request("http://localhost:3000/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "user-stu-01" })
    });

    const res = await demoSessionPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.activePersona.name).toBe("Alex Kumar");
    expect(data.data.activePersona.role).toBe("student");
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it("rejects unknown persona IDs with 422 validation error", async () => {
    const req = new Request("http://localhost:3000/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "unknown-hacker" })
    });

    const res = await demoSessionPOST(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when DEMO_MODE is disabled", async () => {
    process.env.DEMO_MODE = "false";
    const req = new Request("http://localhost:3000/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: "user-stu-01" })
    });

    const res = await demoSessionPOST(req);
    expect(res.status).toBe(404);
  });

  it("restores active persona from session cookie via GET", async () => {
    const session = createDemoSession("user-fac-01");
    mockCookieMap.set("lablink_demo_session", session.token);

    const res = await demoSessionGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.activePersona.name).toBe("Dr. Sarah Jenkins");
    expect(data.data.activePersona.role).toBe("faculty");
  });

  it("clears session cookie on DELETE", async () => {
    mockCookieMap.set("lablink_demo_session", "some_token");
    const res = await demoSessionDELETE();
    expect(res.status).toBe(200);
    expect(mockCookieStore.delete).toHaveBeenCalledWith("lablink_demo_session");
  });
});

describe("Faculty API Authorization & Role Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieMap.clear();
    process.env.DEMO_MODE = "true";
  });

  it("denies student access to GET /api/v1/faculty/requests with 403 Forbidden", async () => {
    const studentSession = createDemoSession("user-stu-01"); // student
    mockCookieMap.set("lablink_demo_session", studentSession.token);

    const res = await facultyRequestsGET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("denies unauthenticated request to GET /api/v1/faculty/requests with 401", async () => {
    mockCookieMap.clear();

    const res = await facultyRequestsGET();
    expect(res.status).toBe(401);
  });

  it("denies student access to PATCH /api/v1/faculty/bookings/[id] with 403 Forbidden", async () => {
    const studentSession = createDemoSession("user-stu-01"); // student
    mockCookieMap.set("lablink_demo_session", studentSession.token);

    const req = new Request("http://localhost:3000/api/v1/faculty/bookings/booking-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved" })
    });

    const res = await facultyBookingDecisionPATCH(req, {
      params: Promise.resolve({ id: "booking-123" })
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("validates decision schema on PATCH /api/v1/faculty/bookings/[id]", async () => {
    const facultySession = createDemoSession("user-fac-01"); // faculty
    mockCookieMap.set("lablink_demo_session", facultySession.token);

    const req = new Request("http://localhost:3000/api/v1/faculty/bookings/booking-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "invalid-status" }) // invalid decision
    });

    const res = await facultyBookingDecisionPATCH(req, {
      params: Promise.resolve({ id: "booking-123" })
    });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Student Booking & AI Recommendation Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieMap.clear();
    process.env.DEMO_MODE = "true";
  });

  it("denies faculty access to student booking endpoint with 403", async () => {
    const facultySession = createDemoSession("user-fac-01"); // faculty
    mockCookieMap.set("lablink_demo_session", facultySession.token);

    const req = new Request("http://localhost:3000/api/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipmentId: "550e8400-e29b-41d4-a716-446655440000",
        projectId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: "2026-11-25T10:00:00Z",
        endTime: "2026-11-25T12:00:00Z"
      })
    });

    const res = await studentBookingPOST(req);
    expect(res.status).toBe(403);
  });

  it("denies non-students from accessing AI recommendation endpoint with 403", async () => {
    const techSession = createDemoSession("user-tech-01"); // technician
    mockCookieMap.set("lablink_demo_session", techSession.token);

    const req = new Request("http://localhost:3000/api/v1/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "550e8400-e29b-41d4-a716-446655440001",
        requirementText: "Deep learning GPU training requirement"
      })
    });

    const res = await aiRecommendationsPOST(req);
    expect(res.status).toBe(403);
  });
});
