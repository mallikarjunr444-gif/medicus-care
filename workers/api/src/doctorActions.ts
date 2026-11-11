import { Hono } from "hono/tiny";
import type { AppVars, Env } from "./env";
import { fail } from "./http";
import { SPECIALISTS } from "./specialists";

export const doctorActions = new Hono<{ Bindings: Env; Variables: AppVars }>();

doctorActions.get("/specialists", (c) => {
  const specialty = c.req.query("specialty")?.toLowerCase();
  const district = (c.req.query("district") ?? "Chikkamagaluru").toLowerCase();
  let docs = SPECIALISTS;
  if (specialty) docs = docs.filter((d) => d.specialty.toLowerCase().includes(specialty) || d.name.toLowerCase().includes(specialty));
  if (district) docs = docs.filter((d) => d.district.toLowerCase().includes(district) || d.location.toLowerCase().includes(district));
  return c.json({ count: docs.length, district: c.req.query("district") ?? "Chikkamagaluru", state: "Karnataka", specialists: docs });
});

doctorActions.post("/appointments/request", async (c) => {
  const b: any = await c.req.json().catch(() => ({}));
  if (b.patient_confirmed === false)
    fail(400, "Explicit patient confirmation is required before booking an appointment.");
  const doc = SPECIALISTS.find((d) => d.id === b.specialist_id);
  if (!doc) fail(404, "Specialist doctor not found.");
  return c.json({
    status: "confirmed_by_patient",
    booking_id: `APT-${doc!.id}-${Math.floor(Date.now() / 1000) % 10000}`,
    specialist: doc,
    appointment_date: b.preferred_date,
    appointment_time_slot: b.preferred_time_slot,
    time_slot: b.preferred_time_slot,
    clinic_location: doc!.location,
    instructions: "Please arrive 15 minutes prior to your consultation slot with existing medical records.",
    hospital_contact: doc!.contact_phone,
  });
});

const PARAMS: { test: RegExp; row: Record<string, string> }[] = [
  { test: /hemoglobin|\bhb\b/, row: { parameter: "Hemoglobin (Hb)", reference_range: "13.5 - 17.5 g/dL (Male) / 12.0 - 15.5 g/dL (Female)", interpretation: "Oxygen-carrying capacity of red blood cells.", status: "Review with physician" } },
  { test: /wbc|leukocyte/, row: { parameter: "Total Leukocyte Count (WBC)", reference_range: "4,500 - 11,000 cells/mcL", interpretation: "Immune system cell count. Elevated levels often reflect bodily defense against viral or bacterial infection.", status: "Review with physician" } },
  { test: /sugar|glucose|hba1c/, row: { parameter: "Fasting Blood Glucose", reference_range: "70 - 99 mg/dL (Normal Fasting)", interpretation: "Basal metabolic glucose level. Values 100-125 indicate prediabetes; >= 126 suggests diabetes mellitus.", status: "Clinical correlation recommended" } },
  { test: /tsh|thyroid/, row: { parameter: "Thyroid Stimulating Hormone (TSH)", reference_range: "0.4 - 4.0 mIU/L", interpretation: "Pituitary regulation of thyroid activity.", status: "Review with physician" } },
];

doctorActions.post("/reports/analyze", async (c) => {
  const b: any = await c.req.json().catch(() => ({}));
  if (typeof b.report_text !== "string")
    return c.json({ detail: [{ loc: ["body", "report_text"], msg: "Field required", type: "missing" }] }, 422);
  const text = b.report_text.slice(0, 50_000).toLowerCase();
  const parameters = PARAMS.filter((p) => p.test.test(text)).map((p) => p.row);
  if (!parameters.length)
    parameters.push({ parameter: "General Laboratory Biomarker", reference_range: "Standard reference intervals vary by laboratory methodology", interpretation: "Automated parameter detection requires standard clinical formatting.", status: "Pending physician review" });
  return c.json({
    report_title: b.test_type || "Clinical Laboratory Diagnostic Analysis",
    parameters_analyzed: parameters,
    preliminary_explanation: "These laboratory values are educational reference guidelines. Reference intervals vary between certified pathology laboratories.",
    clinical_limitations: "Medicus Care is an AI assistant and does not replace in-person pathological review.",
    recommended_doctor_review: "Please share this report packet with your registered general physician for diagnosis and prescription.",
  });
});
