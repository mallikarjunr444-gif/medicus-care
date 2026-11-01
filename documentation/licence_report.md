# Medicus Care™ — Dataset & Model Licensing Governance Report

> **Product:** Medicus Care (Your AI Healthcare Companion)  
> **Parent Brand:** Medicus Labs™  
> **Audited Date:** November 2026  
> **Compliance Standards:** Digital Personal Data Protection Act (DPDP 2023, India), Telemedicine Practice Guidelines (NMC), HIPAA Privacy & Security Rules

---

## 1. Executive Summary

This report provides a formal IP and legal licensing audit for all 15 medical, psychological, voice, and evaluation datasets cloned under `medicus-ai-data/`.

Medicus Care operates under a **Strict Dual-Collection Architecture**:
1. **Clinical & Patient-Facing Retrieval Collection (Production RAG)**: Exclusively utilizes permissively licensed (MIT, Apache 2.0, NIH Public Domain / Creative Commons Attribution) data sources.
2. **Offline Research, Benchmarking & Safety Evaluation Suite**: Segregates non-commercial (CC-BY-NC 4.0), academic-only, and model weights under separate namespaces.

---

## 2. Comprehensive Dataset & Repository License Matrix

| ID | Repository | Upstream Author / Organization | License | Commercial Permissibility | Production RAG Ingestion Status |
|---|---|---|---|---|---|
| **DATA-MED-01** | **MedQuAD** | NIH, MedlinePlus, CDC, NIDDK, NHLBI, NINDS | Creative Commons / NIH Public Domain | ✅ Permitted with source attribution | **Approved for Clinical Knowledge Base** |
| **DATA-MED-02** | **Google MedGemma** | Google Health / DeepMind | Apache 2.0 (Code) / Health AI Developer License (Weights) | ⚠️ Research & evaluation only; requires Google registration for weights | **Excluded from direct patient RAG** (Code used for prompt patterns only) |
| **DATA-MED-03** | **MedMCQA** | Saama AI Research / PMLR 2022 | MIT License | ✅ Permitted | **Designated for Offline Benchmarking Only** (Not patient-facing advice) |
| **DATA-PSY-01** | **Cogni-OpenModel** | CogniX LTD / Meta Llama 3.1 | MIT (Adapter & Tokenizer) / Llama 3.1 Community License | ✅ Permitted (<700M monthly active users) | **Approved for Empathy Tone & Refusal Alignment** |
| **DATA-PSY-02** | **Emotional-Support-Conversation (ESConv)** | Tsinghua University (THU-COAI) | Apache 2.0 License | ✅ Permitted with attribution | **Approved for Psychological Helping Strategies** |
| **DATA-PSY-03** | **EmpatheticDialogues** | Meta AI Research (FAIR) | CC-BY-NC 4.0 (Non-Commercial) | ❌ Academic / Evaluation only | **Strictly Offline Research & Evaluation** |
| **DATA-PSY-04** | **Psy-Insight** | Psy-Insight NLP Group | Research & Educational Open License | ⚠️ Educational Guidance & Evaluation | **Approved for CBT Structured Exercise Outlines** |
| **DATA-PSY-05** | **CACTUS** | CACTUS CBT Research Group | MIT License | ✅ Permitted | **Approved for Guided Mindfulness & Breathing Prompts** |
| **DATA-PSY-06** | **PsyDial** | Qiuhuachuan et al. | MIT License | ✅ Permitted | **Approved for Dialogue Coherence Testing** |
| **DATA-PSY-07** | **PsyLLM** | Emo-gml Group | Academic Research License | ⚠️ Non-commercial research | **Designated for Guardrail Evaluation Only** |
| **DATA-PSY-08** | **Awesome-Mental-Health-LLMs** | Emo-gml Group | MIT License | ✅ Permitted | **Approved Reference Survey & E-E-A-T Citations** |
| **DATA-PSY-09** | **Awesome-Open-Mental-Health-Dialogue-Datasets** | Kevin11Kaikai | Open Catalog / MIT | ✅ Permitted | **Approved Metadata Catalog** |
| **DATA-VOX-01** | **AI4Bharat IndicF5** | AI4Bharat / IIT Madras | MIT / F5-TTS Open License | ✅ Permitted with attribution | **Approved for Indian Accent & Multilingual TTS** |
| **DATA-VOX-02** | **AI4Bharat IndicConformerASR** | AI4Bharat / IIT Madras | MIT License | ✅ Permitted | **Approved for Multilingual Indic Speech Recognition** |
| **DATA-VOX-03** | **Silero VAD** | Snakers4 / Silero | MIT License | ✅ Permitted | **Approved for Local Real-time Voice Activity Detection** |

---

## 3. Strict Clinical Data Boundaries

1. **Medical Examination Questions vs. Patient Care Guidelines**:
   - `MedMCQA` contains AIIMS and NEET-PG entrance exam multiple-choice questions. Under no circumstances are exam questions or options ingested as patient-facing medical facts. They are isolated exclusively for testing model diagnostic reasoning.
2. **Research Therapy vs. Medical Disclaimers**:
   - `ESConv`, `Psy-Insight`, and `CACTUS` datasets provide educational dialogue techniques, empathetic validation, and guided relaxation exercises. The AI Psychologist module strictly discloses that it is a supportive AI companion, not a licensed therapist or psychiatrist.
3. **Intellectual Property Safeguards**:
   - All RAG chunks indexed in PostgreSQL (`pgvector`) carry persistent metadata keys: `source_name`, `license`, `origin_url`, and `retrieval_category`.
