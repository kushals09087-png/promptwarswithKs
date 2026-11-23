import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/http";

const InputSchema = z.object({
  projectId: z.string().uuid(),
  requirementText: z.string().trim().min(5).max(2000)
});
const OutputSchema = z.object({
  interpretedRequirements: z.array(z.string()).max(10),
  recommendedEquipmentIds: z.array(z.string().uuid()).max(10),
  explanations: z.array(z.string()).max(10),
  warnings: z.array(z.string()).max(10)
});

export async function POST(request: Request) {
  const auth = await requireRole(["student"]);
  if (auth.error) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid recommendation request.", 422);

  const supabase = await createClient();
  const { data: project } = await supabase.from("projects")
    .select("id,title,description,deadline")
    .eq("id", parsed.data.projectId).eq("student_id", auth.context.userId).maybeSingle();
  if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);

  const { data: equipment, error } = await supabase.from("equipment")
    .select("id,name,description,specifications,status,department_id")
    .eq("status", "active").limit(50);
  if (error) return apiError("EQUIPMENT_QUERY_FAILED", "Unable to load equipment context.", 500);

  if (!process.env.GEMINI_API_KEY) {
    return apiSuccess({
      mode: "deterministic-fallback",
      message: "AI is not configured. Use the equipment catalogue and deterministic scheduling checks.",
      interpretedRequirements: [parsed.data.requirementText],
      candidates: equipment ?? []
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Interpret this academic project requirement. Only select IDs from the supplied equipment list. Never claim availability or approve bookings. Return JSON only with interpretedRequirements (string[]), recommendedEquipmentIds (string[]), explanations (string[]), warnings (string[]).\nProject: ${project.title}\nDeadline: ${project.deadline}\nRequirement: ${parsed.data.requirementText}\nEquipment: ${JSON.stringify(equipment)}`;
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI timeout")), 10000))
    ]);
    const raw = result.response.text().replace(/^```(?:json)?\s*|\s*```$/g, "");
    const output = OutputSchema.safeParse(JSON.parse(raw));
    if (!output.success) throw new Error("Invalid AI response");
    const validIds = new Set((equipment ?? []).map(item => item.id));
    const safeOutput = {
      ...output.data,
      recommendedEquipmentIds: output.data.recommendedEquipmentIds.filter(id => validIds.has(id))
    };
    return apiSuccess({ mode: "gemini", ...safeOutput });
  } catch {
    return apiSuccess({
      mode: "deterministic-fallback",
      message: "AI recommendations are temporarily unavailable. The catalogue remains available.",
      interpretedRequirements: [parsed.data.requirementText],
      candidates: equipment ?? []
    });
  }
}
