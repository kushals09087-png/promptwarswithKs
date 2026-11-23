import { describe, it, expect } from "vitest";
import { ProjectSchema } from "./project.schema";

describe("ProjectSchema Validation", () => {
  const validProject = {
    title: "Autonomous Quadruped Navigation",
    description: "Developing reinforcement learning algorithms for multi-terrain quadruped robotics.",
    requirements: "Requires high-performance GPU workstation and motion capture rig.",
    deadline: "2026-12-15"
  };

  it("validates a fully compliant academic project", () => {
    const result = ProjectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Autonomous Quadruped Navigation");
      expect(result.data.deadline).toBe("2026-12-15");
    }
  });

  it("rejects project title that is too short (< 3 characters)", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      title: "AI"
    });
    expect(result.success).toBe(false);
  });

  it("rejects project title exceeding 120 characters", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      title: "A".repeat(125)
    });
    expect(result.success).toBe(false);
  });

  it("rejects project description that is too short (< 10 characters)", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      description: "Short"
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid deadline date format", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      deadline: "not-a-date"
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from inputs", () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      title: "   Trimmed Robotic Arm Project   "
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Trimmed Robotic Arm Project");
    }
  });
});
