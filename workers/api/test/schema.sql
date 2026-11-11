-- Mirror of backend/app/models.py + alembic 0000-0005 (Alembic remains the source of truth).
CREATE TABLE users (
  id varchar PRIMARY KEY, email varchar NOT NULL UNIQUE, username varchar NOT NULL UNIQUE,
  hashed_password varchar NOT NULL, full_name varchar, is_active boolean DEFAULT true,
  is_superuser boolean DEFAULT false, is_guest boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz);
CREATE TABLE avatars (
  id varchar PRIMARY KEY, user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar NOT NULL, image_url varchar NOT NULL, thumbnail_url varchar, s3_key varchar NOT NULL,
  status varchar DEFAULT 'processing', voice_id varchar, avatar_metadata json,
  created_at timestamptz DEFAULT now(), updated_at timestamptz);
CREATE TABLE sessions (
  id varchar PRIMARY KEY, user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_id varchar NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  status varchar DEFAULT 'active', settings json, started_at timestamptz DEFAULT now(), ended_at timestamptz);
CREATE TABLE messages (
  id varchar PRIMARY KEY, session_id varchar NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role varchar NOT NULL, content text NOT NULL, content_type varchar DEFAULT 'text',
  audio_url varchar, video_url varchar, message_metadata json, tokens integer, latency double precision,
  created_at timestamptz DEFAULT now());
CREATE TABLE conversations (
  id varchar PRIMARY KEY, session_id varchar NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title varchar, summary text, message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz);
CREATE TABLE consultation_reports (
  id varchar PRIMARY KEY, session_id varchar NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE, doctor_id varchar, language varchar,
  triage_level integer, duration_seconds integer, report json NOT NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz);
