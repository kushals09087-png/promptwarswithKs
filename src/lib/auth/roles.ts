import { z } from "zod";

export const RoleKeySchema = z.enum([
  "student",
  "faculty",
  "technician",
  "lab_admin",
  "admin",
  "hod",
  "management"
]);

export type RoleKey = z.infer<typeof RoleKeySchema>;

export const PersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: RoleKeySchema,
  roleLabel: z.string().min(1),
  roleTitle: z.string().min(1),
  department: z.string().min(1),
  avatar: z.string().min(1),
  badge: z.string().min(1),
  email: z.string().email(),
  subtitle: z.string(),
  summary: z.string(),
  departmentId: z.string().optional()
});

export type UserPersona = z.infer<typeof PersonaSchema>;

export const DEMO_PERSONAS: Record<string, UserPersona> = {
  student: {
    id: "user-stu-01",
    name: "Alex Kumar",
    role: "student",
    roleLabel: "Student",
    roleTitle: "Undergraduate Student Researcher",
    department: "Computer Science & IoT",
    avatar: "AK",
    badge: "Student",
    email: "alex.kumar@campus.edu",
    subtitle: "CS Senior · Reg #CS2026-442",
    summary: "Discover cross-department equipment, submit booking requests, link academic projects, and track slot approvals.",
    departmentId: "dept-cs-01"
  },
  faculty: {
    id: "user-fac-01",
    name: "Dr. Sarah Jenkins",
    role: "faculty",
    roleLabel: "Faculty / Guide",
    roleTitle: "Associate Professor & Project Guide",
    department: "Electronics & Communication",
    avatar: "SJ",
    badge: "Faculty / Guide",
    email: "s.jenkins@campus.edu",
    subtitle: "Faculty Advisor · Robotics & AI Lab",
    summary: "Review student booking requests, endorse project academic suitability, recommend alternative hardware, and monitor mentees.",
    departmentId: "dept-ece-01"
  },
  technician: {
    id: "user-tech-01",
    name: "Rajesh Verma",
    role: "technician",
    roleLabel: "Lab Technician",
    roleTitle: "Senior Laboratory Technician",
    department: "Central Instrumentation Facility",
    avatar: "RV",
    badge: "Lab Technician",
    email: "r.verma@campus.edu",
    subtitle: "Lead Technician · Blocks A & C Labs",
    summary: "Manage equipment operational health, process student handovers and returns, report damaged units, and log maintenance.",
    departmentId: "dept-cif-01"
  },
  lab_admin: {
    id: "user-adm-01",
    name: "Prof. Marcus Vance",
    role: "lab_admin",
    roleLabel: "Lab Administrator",
    roleTitle: "Central Lab Administrator & Facility In-Charge",
    department: "Academic Infrastructure",
    avatar: "MV",
    badge: "Lab Administrator",
    email: "m.vance@campus.edu",
    subtitle: "Facility Administrator · All Campus Labs",
    summary: "Authorize final equipment allocations, resolve schedule overlaps, enforce quota policies, and balance campus laboratory load.",
    departmentId: "dept-infra-01"
  },
  admin: {
    id: "user-adm-01",
    name: "Prof. Marcus Vance",
    role: "admin",
    roleLabel: "Lab Administrator",
    roleTitle: "Central Lab Administrator & Facility In-Charge",
    department: "Academic Infrastructure",
    avatar: "MV",
    badge: "Lab Administrator",
    email: "m.vance@campus.edu",
    subtitle: "Facility Administrator · All Campus Labs",
    summary: "Authorize final equipment allocations, resolve schedule overlaps, enforce quota policies, and balance campus laboratory load.",
    departmentId: "dept-infra-01"
  },
  hod: {
    id: "user-hod-01",
    name: "Dr. Aris Thorne",
    role: "hod",
    roleLabel: "Department Head",
    roleTitle: "Head of Department (HOD)",
    department: "Computer Science & Engineering",
    avatar: "AT",
    badge: "Department Head",
    email: "hod.cse@campus.edu",
    subtitle: "HOD · Department of Computer Science",
    summary: "Audit department laboratory inventory, track asset utilization, review special high-priority requests, and plan capital procurement.",
    departmentId: "dept-cs-01"
  },
  management: {
    id: "user-mgmt-01",
    name: "Dr. Elena Rostova",
    role: "management",
    roleLabel: "College Management",
    roleTitle: "Dean of Academic & Research Infrastructure",
    department: "Institutional Leadership",
    avatar: "ER",
    badge: "College Management",
    email: "dean.infra@campus.edu",
    subtitle: "Dean · Campus Resource Governance",
    summary: "Institution-wide asset utilization, cross-department resource sharing ROI, budget allocation, and capacity expansion intelligence.",
    departmentId: "dept-lead-01"
  }
};

// Canonical list of the 6 distinct stakeholder personas for UI rendering
export const SIX_PERSONAS: UserPersona[] = [
  DEMO_PERSONAS.student,
  DEMO_PERSONAS.faculty,
  DEMO_PERSONAS.technician,
  DEMO_PERSONAS.lab_admin,
  DEMO_PERSONAS.hod,
  DEMO_PERSONAS.management
];

export const PERSONAS_BY_ID: Record<string, UserPersona> = {
  "user-stu-01": DEMO_PERSONAS.student,
  "user-fac-01": DEMO_PERSONAS.faculty,
  "user-tech-01": DEMO_PERSONAS.technician,
  "user-adm-01": DEMO_PERSONAS.lab_admin,
  "user-hod-01": DEMO_PERSONAS.hod,
  "user-mgmt-01": DEMO_PERSONAS.management
};

export const PersonaIdList = [
  "user-stu-01",
  "user-fac-01",
  "user-tech-01",
  "user-adm-01",
  "user-hod-01",
  "user-mgmt-01"
] as const;

export const PersonaIdSchema = z.enum(PersonaIdList);

export type Permission =
  | "equipment:browse"
  | "equipment:create"
  | "equipment:edit_status"
  | "equipment:maintenance"
  | "booking:request"
  | "booking:faculty_approve"
  | "booking:admin_allocate"
  | "booking:handover"
  | "booking:return"
  | "booking:cancel"
  | "project:create"
  | "project:view_mentees"
  | "analytics:lab"
  | "analytics:department"
  | "analytics:institution"
  | "safety:report"
  | "ai:student_recommend"
  | "ai:faculty_audit"
  | "ai:admin_balance";

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  student: [
    "equipment:browse",
    "booking:request",
    "booking:cancel",
    "project:create",
    "ai:student_recommend"
  ],
  faculty: [
    "equipment:browse",
    "booking:faculty_approve",
    "project:view_mentees",
    "safety:report",
    "ai:faculty_audit"
  ],
  technician: [
    "equipment:browse",
    "equipment:create",
    "equipment:edit_status",
    "equipment:maintenance",
    "booking:handover",
    "booking:return",
    "analytics:lab",
    "safety:report"
  ],
  lab_admin: [
    "equipment:browse",
    "equipment:create",
    "equipment:edit_status",
    "equipment:maintenance",
    "booking:admin_allocate",
    "booking:cancel",
    "analytics:lab",
    "analytics:department",
    "safety:report",
    "ai:admin_balance"
  ],
  admin: [
    "equipment:browse",
    "equipment:create",
    "equipment:edit_status",
    "equipment:maintenance",
    "booking:admin_allocate",
    "booking:cancel",
    "analytics:lab",
    "analytics:department",
    "safety:report",
    "ai:admin_balance"
  ],
  hod: [
    "equipment:browse",
    "booking:faculty_approve",
    "booking:admin_allocate",
    "analytics:department",
    "safety:report"
  ],
  management: [
    "equipment:browse",
    "analytics:department",
    "analytics:institution"
  ]
};

export function hasPermission(role: RoleKey, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function roleToRoutePath(role: RoleKey): string {
  switch (role) {
    case "student": return "/student";
    case "faculty": return "/faculty";
    case "technician": return "/technician";
    case "lab_admin":
    case "admin": return "/lab-admin";
    case "hod": return "/hod";
    case "management": return "/management";
  }
}
