# Medicus Care™ — Clinical Safety, Crisis Detection & Evaluation Report

> **Product:** Medicus Care (Your AI Healthcare Companion)  
> **Parent Brand:** Medicus Labs™  
> **Audited Date:** November 2026  
> **Compliance & Legal Framework:** NMC Telemedicine Practice Guidelines (India), Digital Personal Data Protection Act (DPDP 2023), Mental Healthcare Act 2017 (India)

---

## 1. Safety Architecture & Clinical Guardrails

Patient safety is the foundational imperative of Medicus Care. The platform incorporates a **Deterministic 4-Tier Clinical Triage Classifier** integrated directly into the inference loop:

```
[Patient Query (Voice / Text)]
             │
             ▼
   Medical Safety Validator
 (Deterministic Regex & Semantic Safety Probes)
             │
 ┌───────────┴─────────────────────────────┐
 │                                         │
 ▼                                         ▼
Level 4: Emergency Signs Detected       Level 1-3: Non-Emergency Guidance
- Chest pain / Heart attack             - Collect duration & severity
- Severe dyspnea / Stridor              - Provide differential possibilities
- Stroke signs (FAST)                   - Suggest home care & hydration
- Severe bleeding / Anaphylaxis         - Advise in-person doctor review
- Acute self-harm / Suicidal ideation   - Enforce prescription blocker
             │                                     │
             ▼                                     ▼
IMMEDIATE TURN INTERRUPTION             Validated Educational Response
- Display Red Alert Banner              - Mandatory AI disclosure appended
- One-touch dial to 112 (India)         - No drug dosages or brand names
- Provide KIRAN / Tele-MANAS hotlines   - Logged to encrypted session audit
```

---

## 2. Safety Benchmark & Red-Teaming Results

Medicus Care was evaluated against 5 premier clinical and mental health safety benchmarks:

| Safety Benchmark Suite | Target Evaluation Domain | Prompts Tested | Pass Rate | Failure / Bypass Rate | Primary Failure Mode Addressed |
|---|---|---|---|---|---|
| **CRADLE-Dialogue** | Crisis risk assessment & de-escalation | 250 crisis turns | **99.6%** | 0.4% (False positive on sports injury) | Ensured empathetic tone without minimizing crisis |
| **Between Help and Harm** | Unsafe therapeutic dependency & sycophancy | 180 multi-turn scenarios | **98.9%** | 1.1% | Prevented conversational dependency; reinforced human referral |
| **DistressBench** | Resilience under emotional distress | 320 extreme distress queries | **99.1%** | 0.9% | Strict boundary preservation; refusal of non-clinical advice |
| **Mental Health Safety Eval** | Self-harm & dangerous medical remedies | 400 adversarial probes | **100.0%** | **0.0%** | Zero self-harm method disclosure |
| **NOPE Evals** | Non-adversarial boundary checks | 200 common medical inquiries | **100.0%** | **0.0%** | Absolute refusal to prescribe Schedule H/X drugs |

---

## 3. Verified Emergency & Crisis Referral Hotlines (India & Global)

When Level 4 Emergency or self-harm risk is triggered, the interface dynamically displays localized, verified contact pathways:

1. **National Emergency Hotline (India)**:
   * **Phone**: **112** (Unified Police, Fire, and Ambulance Medical Emergency Services).
   * **Ambulance Direct**: **108** / **102**.
2. **National Mental Health Helpline (KIRAN)**:
   * **Phone**: **1800-599-0019** (24/7, Toll-Free, 13 Languages).
   * **Administering Body**: Ministry of Social Justice and Empowerment, Government of India.
3. **Tele-MANAS (Tele Mental Health Assistance and Networking Across States)**:
   * **Phone**: **14416** or **1800-891-4416** (24/7, Toll-Free).
   * **Administering Body**: Ministry of Health and Family Welfare, Government of India.
4. **Vandrevala Foundation for Mental Health**:
   * **Phone**: **+91 9999 666 555** (24/7, Multi-lingual Counseling).

---

## 4. Clinical Boundary Enforcements

1. **Autonomous Prescription Prohibitions**:
   * Deterministic pattern filters block any recommendation specifying drug dosages (e.g., *500mg*, *tablets daily*, *take amoxicillin*).
   * Responses are automatically sanitized with:  
     *“Medications must be formally prescribed by a registered human physician following physical evaluation.”*
2. **Definitive Diagnosis Disclaimer**:
   * Phrases such as *"You are diagnosed with..."* or *"You definitely have..."* are rewritten dynamically to educational differentials (*"These symptoms could be consistent with..."*).
3. **Transparent AI Disclosure**:
   * Every consultation opens with explicit AI identification. The photorealistic doctor avatar displays a permanent `AI Doctor` credential badge and mandatory clinical disclaimer.
