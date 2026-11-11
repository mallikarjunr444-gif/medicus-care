"""Load the bundled medical / mental-wellness knowledge chunks into Postgres.

Creates `knowledge_chunks` with a full-text index so the edge API can retrieve
reference excerpts for the doctors. Idempotent: re-running upserts by chunk_id.
Usage: DATABASE_URL=... python scripts/load_knowledge.py
"""
import json, os, sys
from pathlib import Path
import psycopg
from psycopg.types.json import Jsonb

ROOT = Path(__file__).resolve().parents[1] / "database" / "rag_store"
FILES = ["medical_index.json", "mental_wellness_index.json"]

DDL = """
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  chunk_id text PRIMARY KEY,
  collection text NOT NULL,
  category text,
  title text NOT NULL,
  content text NOT NULL,
  source_name text,
  origin_url text,
  license text,
  approved boolean NOT NULL DEFAULT true,
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')) STORED
);
CREATE INDEX IF NOT EXISTS knowledge_chunks_tsv_idx ON knowledge_chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS knowledge_chunks_collection_idx ON knowledge_chunks (collection);
"""

def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 1
    total = 0
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(DDL)
        for name in FILES:
            rows = json.loads((ROOT / name).read_text())
            batch = []
            for r in rows:
                if r.get("approved_by_admin") is False:
                    continue
                batch.append((r["chunk_id"], r["collection"], r.get("category"), r["title"][:500],
                              r["content"], r.get("source_name"), r.get("origin_url"), r.get("license")))
            with conn.cursor() as cur:
                for i in range(0, len(batch), 500):
                    cur.executemany(
                        """INSERT INTO knowledge_chunks (chunk_id, collection, category, title, content, source_name, origin_url, license)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                           ON CONFLICT (chunk_id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content,
                             category = EXCLUDED.category, source_name = EXCLUDED.source_name""",
                        batch[i:i + 500])
            print(f"{name}: {len(batch)} chunks")
            total += len(batch)
        n = conn.execute("SELECT count(*) FROM knowledge_chunks").fetchone()[0]
    print(f"loaded {total}; table now holds {n}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
