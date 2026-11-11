import { Hono } from "hono/tiny";
import { requireUser } from "./auth";
import type { AppVars, Env } from "./env";
import { fail } from "./http";

export const DOCTORS: Record<string, { name: string; specialty: string; image: string }> = {
  dr_ananya: {
    name: "Dr. Ananya",
    specialty: "AI Psychologist / Mental Wellness Consultant",
    image: "/doctor/dr_ananya.jpg",
  },
  dr_arjun: { name: "Dr. Smit", specialty: "General Physician", image: "/doctor/dr_arjun.jpg" },
};

const ANANYA_PROMPT = `You are Dr. Ananya, MediCare's AI Mental Wellness Companion.
You are an AI assistant, not a licensed psychologist, psychiatrist or human doctor. Provide empathetic, supportive, psychology-informed conversation. Listen first, acknowledge what the user shared, and ask ONE relevant question at a time. Never repeat a question already answered. Use general educational support about stress, anxiety, loneliness, relationships, sleep, mindfulness and healthy coping. Never diagnose, prescribe, or change medication, and never invent research.
SAFETY: if the user expresses suicidal thoughts, self-harm or immediate danger, respond with empathy, take it seriously, encourage a trusted person and qualified human help, and give the Indian emergency number 112. Never give self-harm methods.
FORMAT: 1-3 short spoken sentences, no lists or markdown, no restarting with greetings, never read URLs aloud.`;

export function systemPrompt(doctorId: string): string {
  if (doctorId === "dr_ananya") return ANANYA_PROMPT;
  const d = DOCTORS[doctorId] ?? DOCTORS.dr_arjun;
  return (
    `You are MediCare's AI doctor persona named ${d.name}, focused on ${d.specialty}. ` +
    "Be warm, concise and conversational for speech. Talk like a caring doctor: listen first, acknowledge what the patient just said, " +
    "and ask ONE short follow-up question at a time. Use the conversation history so the patient never repeats themselves; do not restart with greetings. " +
    "Give practical general guidance, and suggest clinician review only when symptoms or uncertainty make it relevant. " +
    "For possible emergencies give clear urgent-care instructions (India: call 112) immediately. " +
    "Be transparent that you are an AI assistant, not a human clinician. Do not invent a biography, credentials or studies; do not diagnose or prescribe. " +
    "Keep replies to 1-3 short spoken sentences, no lists or markdown."
  );
}

export const doctors = new Hono<{ Bindings: Env; Variables: AppVars }>();
doctors.use("*", requireUser);

/** Upserts the caller's avatar row for a built-in doctor (same ids as the Python API). */
doctors.post("/:doctor_id/avatar", async (c) => {
  const doctorId = c.req.param("doctor_id");
  const d = DOCTORS[doctorId];
  if (!d) fail(404, "Doctor profile not found");
  const uid = c.var.user!.id;
  // Deterministic per (user, doctor), UUID-shaped like the Python uuid5.
  const bytes = new TextEncoder().encode(`medicare:${uid}:${doctorId}`);
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  const rows = await c.var.query(
    `INSERT INTO avatars (id, user_id, name, image_url, thumbnail_url, s3_key, status, avatar_metadata)
     VALUES ($1,$2,$3,$4,$4,$5,'ready',$6::jsonb)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'ready', updated_at = now()
     RETURNING *`,
    [id, uid, d.name, d.image, `avatars/${id}/image.jpg`, JSON.stringify({ doctor_id: doctorId })],
  );
  const a = rows[0];
  return c.json({
    id: a.id,
    name: a.name,
    image_url: a.image_url,
    thumbnail_url: a.thumbnail_url,
    s3_key: a.s3_key,
    status: a.status,
  });
});
