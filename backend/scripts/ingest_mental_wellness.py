"""Import eligible dialogue datasets into the review-only RAG queue.

Run from the repository root, for example:
  python backend/scripts/ingest_mental_wellness.py \
    --source kaggle-mental-health --path ~/Downloads/mental-health.zip

The importer never auto-approves records. See MEDICARE_KNOWLEDGE_BASE.md for
dataset eligibility and review requirements.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import zipfile
from pathlib import Path
from typing import Any, Iterator

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.rag_service import rag_service  # noqa: E402


MAX_JSON_BYTES = 128 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 2_000
SUPPORTED_SUFFIXES = {".csv", ".json", ".jsonl"}

SOURCES = {
    "kaggle-mental-health": {
        "dataset_id": "nguyenletruongthien/mental-health",
        "source_name": "Mental Health Conversational AI Training Dataset (Kaggle)",
        "license": "CC BY 4.0",
        "url": "https://www.kaggle.com/datasets/nguyenletruongthien/mental-health",
    },
    "kaggle-counseling": {
        "dataset_id": "melissamonfared/mental-health-counseling-conversations-k",
        "source_name": "Mental Health Counseling Conversations (Kaggle)",
        "license": "MIT",
        "url": "https://www.kaggle.com/datasets/melissamonfared/mental-health-counseling-conversations-k",
    },
    "huggingface-mental-health-counseling": {
        "dataset_id": "Amod/mental_health_counseling_conversations",
        "source_name": "Mental Health Counseling Conversations (Hugging Face)",
        "license": "RAIL-D",
        "url": "https://huggingface.co/datasets/Amod/mental_health_counseling_conversations",
    },
}

QUESTION_FIELDS = (
    "context", "question", "question_text", "questionText", "input", "prompt", "query", "user_message", "user"
)
ANSWER_FIELDS = (
    "response", "answer", "answer_text", "answerText", "output", "reply", "assistant_message", "therapist_response", "assistant"
)
ID_FIELDS = ("id", "record_id", "_id", "uid", "question_id")


def _normalized_key(value: Any) -> str:
    return "".join(char for char in str(value).lower() if char.isalnum())


def _field(record: dict[str, Any], choices: tuple[str, ...]) -> str:
    normalized = {_normalized_key(key): value for key, value in record.items()}
    for choice in choices:
        value = normalized.get(_normalized_key(choice))
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _unwrap_json(data: Any) -> Iterator[dict[str, Any]]:
    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict):
                yield row
        return
    if isinstance(data, dict):
        for key in ("data", "records", "examples", "conversations", "training", "intents", "root"):
            nested = data.get(key)
            if isinstance(nested, list):
                yield from _unwrap_json(nested)
                return
            if isinstance(nested, dict):
                yield from _unwrap_json(nested)
                return
        yield data


def _iter_file_records(file_obj, filename: str) -> Iterator[dict[str, Any]]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".csv":
        text_file = io.TextIOWrapper(file_obj, encoding="utf-8-sig", errors="replace", newline="")
        try:
            yield from csv.DictReader(text_file)
        finally:
            text_file.detach()
        return

    if suffix == ".jsonl":
        text_file = io.TextIOWrapper(file_obj, encoding="utf-8", errors="replace")
        try:
            for line in text_file:
                if line.strip():
                    row = json.loads(line)
                    if isinstance(row, dict):
                        yield row
        finally:
            text_file.detach()
        return

    if suffix == ".json":
        raw = file_obj.read(MAX_JSON_BYTES + 1)
        if len(raw) > MAX_JSON_BYTES:
            raise ValueError(f"Refusing oversized JSON file (>128 MiB): {filename}")
        yield from _unwrap_json(json.loads(raw.decode("utf-8-sig")))


def iter_source_records(source_path: Path) -> Iterator[tuple[dict[str, Any], str]]:
    """Stream JSON/JSONL/CSV rows from a downloaded Kaggle archive or folder."""
    source_path = source_path.expanduser().resolve()
    if source_path.is_dir():
        files = sorted(
            path for path in source_path.rglob("*")
            if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
        )
        if len(files) > MAX_ARCHIVE_ENTRIES:
            raise ValueError("Source directory contains too many data files")
        for path in files:
            if path.stat().st_size > MAX_JSON_BYTES and path.suffix.lower() == ".json":
                raise ValueError(f"Refusing oversized JSON file (>128 MiB): {path.name}")
            with path.open("rb") as source_file:
                for row in _iter_file_records(source_file, path.name):
                    yield row, path.name
        return

    if source_path.suffix.lower() != ".zip":
        raise ValueError("--path must point to a Kaggle .zip archive or extracted dataset directory")

    with zipfile.ZipFile(source_path) as archive:
        members = sorted(
            member for member in archive.infolist()
            if not member.is_dir()
            and Path(member.filename).suffix.lower() in SUPPORTED_SUFFIXES
        )
        if len(members) > MAX_ARCHIVE_ENTRIES:
            raise ValueError("Archive contains too many data files")
        for member in members:
            if member.file_size > MAX_JSON_BYTES and Path(member.filename).suffix.lower() == ".json":
                raise ValueError(f"Refusing oversized JSON file (>128 MiB): {member.filename}")
            with archive.open(member) as source_file:
                for row in _iter_file_records(source_file, member.filename):
                    yield row, Path(member.filename).name


def to_qa_record(row: dict[str, Any], source_file: str, row_number: int) -> dict[str, str] | None:
    question = _field(row, QUESTION_FIELDS)
    answer = _field(row, ANSWER_FIELDS)

    # The Kaggle bundle also includes intent records with multiple example
    # phrasings and candidate replies instead of a single Context/Response pair.
    if not question or not answer:
        patterns = row.get("patterns")
        responses = row.get("responses")
        if isinstance(patterns, list) and isinstance(responses, list):
            user_examples = [item.strip() for item in patterns if isinstance(item, str) and item.strip()]
            reply_examples = [item.strip() for item in responses if isinstance(item, str) and item.strip()]
            if user_examples and reply_examples:
                question = "User message examples:\n- " + "\n- ".join(user_examples)
                answer = "Candidate response examples:\n- " + "\n- ".join(reply_examples)

    # Some exported conversation files store role/content turns rather than
    # separate question/answer columns. Use the final user and assistant turns.
    if not question or not answer:
        messages = row.get("messages") or row.get("dialog")
        if isinstance(messages, list):
            user_turns, assistant_turns = [], []
            for message in messages:
                if not isinstance(message, dict):
                    continue
                role = str(message.get("role") or message.get("speaker") or "").lower()
                text = message.get("content") or message.get("text")
                if not isinstance(text, str) or not text.strip():
                    continue
                if role in {"user", "client", "patient", "human"}:
                    user_turns.append(text.strip())
                elif role in {"assistant", "supporter", "therapist", "counselor", "psychologist"}:
                    assistant_turns.append(text.strip())
            if user_turns and assistant_turns:
                question, answer = user_turns[-1], assistant_turns[-1]

    if len(question) < 8 or len(answer) < 20:
        return None
    record_id = _field(row, ID_FIELDS) or f"{source_file}:{row_number}"
    return {
        "question": question,
        "answer": answer,
        "record_id": record_id,
        "source_file": source_file,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, choices=(*SOURCES, "psychology-10k", "mentalhealthbenchx"))
    parser.add_argument("--path", type=Path, help="Downloaded dataset ZIP or extracted folder")
    parser.add_argument("--max-rows", type=int, default=2_000, help="Maximum source rows to inspect (default: 2000)")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    if args.max_rows < 1:
        print("--max-rows must be at least 1", file=sys.stderr)
        return 2

    if args.source == "psychology-10k":
        print(
            "Not imported: samhog/psychology-10k has no declared license in its dataset metadata. "
            "Confirm rights with the owner before copying it into this application.",
            file=sys.stderr,
        )
        return 2
    if args.source == "mentalhealthbenchx":
        print(
            "Not imported: li-lab/MentalHealthBenchX explicitly says it is a benchmark, not training or patient-facing RAG data. "
            "Keep it in an isolated evaluation workflow.",
            file=sys.stderr,
        )
        return 2
    if not args.path:
        print("--path is required for Kaggle sources", file=sys.stderr)
        return 2

    source = SOURCES[args.source]

    def qa_records():
        for row_number, (row, filename) in enumerate(iter_source_records(args.path), start=1):
            if row_number > args.max_rows:
                break
            record = to_qa_record(row, filename, row_number)
            if record:
                yield record

    try:
        count = rag_service.ingest_mental_wellness_qa(
            qa_records(),
            source_name=source["source_name"],
            license_name=source["license"],
            origin_url=source["url"],
            dataset_id=source["dataset_id"],
            max_records=args.max_rows,
        )
    except (OSError, ValueError, json.JSONDecodeError, zipfile.BadZipFile) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1

    print(
        f"Staged {count} records in the mental_wellness review queue; none were auto-approved. "
        f"Review/approve them in the Admin Knowledge Console before patient retrieval."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
