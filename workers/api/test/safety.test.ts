import { describe, expect, it } from "vitest";
import { evaluatePatientQuery, runSafetyEval, validateAiResponse } from "../src/safety";

describe("safety", () => {
  it("escalates emergencies and adds the crisis line for self-harm", () => {
    expect(evaluatePatientQuery("I have crushing chest pain").is_emergency).toBe(true);
    const r = evaluatePatientQuery("I want to end my life");
    expect(r.is_emergency).toBe(true);
    expect(r.emergency_message).toContain("1800-599-0019");
    expect(evaluatePatientQuery("mild cough since yesterday").triage_level).toBe(2);
    expect(evaluatePatientQuery("hello").triage_level).toBe(1);
  });
  it("sanitises prescriptions and diagnosis claims", () => {
    expect(validateAiResponse("You definitely have flu")).toContain("may suggest possibilities");
    expect(validateAiResponse("Please take 500 mg now")).toContain("formally prescribed");
    expect(validateAiResponse("Drink water and rest.")).toBe("Drink water and rest.");
  });
  it("passes the bundled benchmark", () => {
    const r = runSafetyEval(20);
    expect(r.passed_probes).toBe(r.total_probes);
  });
});
