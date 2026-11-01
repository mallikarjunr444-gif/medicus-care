-- Medicus Care™ Database Schema
-- Dedicated schema isolated from Medicus Labs Dermatology Application

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Consultation Sessions
CREATE TABLE IF NOT EXISTS consultation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(128) NOT NULL,
    doctor_id VARCHAR(64) NOT NULL DEFAULT 'dr_arjun',
    language VARCHAR(8) NOT NULL DEFAULT 'en',
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- active, ended, escalated
    triage_level INT NOT NULL DEFAULT 1, -- 1: General, 2: Assessment, 3: Urgent, 4: Emergency
    duration_seconds INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 2. Consultation Transcripts & Messages
CREATE TABLE IF NOT EXISTS consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    sender_role VARCHAR(16) NOT NULL, -- 'patient' or 'doctor'
    content TEXT NOT NULL,
    audio_url TEXT,
    video_chunk_url TEXT,
    triage_flag INT DEFAULT 1,
    warning_flag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Structured Clinical Intake & Summaries
CREATE TABLE IF NOT EXISTS clinical_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    consultation_code VARCHAR(64) NOT NULL UNIQUE,
    doctor_name VARCHAR(128) NOT NULL,
    language VARCHAR(16) NOT NULL,
    duration_formatted VARCHAR(32) NOT NULL,
    patient_reported_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    symptom_duration VARCHAR(128),
    relevant_history TEXT,
    differential_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
    warning_signs JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    referral_recommendation TEXT NOT NULL,
    clinical_disclaimer TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Medical Safety & Emergency Audit Log
CREATE TABLE IF NOT EXISTS emergency_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES consultation_sessions(id) ON DELETE SET NULL,
    patient_id VARCHAR(128),
    trigger_text TEXT NOT NULL,
    emergency_type VARCHAR(64) NOT NULL, -- 'chest_pain', 'dyspnea', 'stroke', 'crisis'
    escalation_hotline VARCHAR(16) DEFAULT '112',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid telemedicine query lookups
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON consultation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_summaries_code ON clinical_summaries(consultation_code);
