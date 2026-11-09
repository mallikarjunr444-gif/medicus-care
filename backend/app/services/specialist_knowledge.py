"""Specialist-scoped PDF knowledge ingestion with Qdrant persistence."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional

SPECIALIST_COLLECTIONS = {"dr_ananya": "mental_wellness"}
DOCTOR_COLLECTIONS = {"dr_ananya": "mental_wellness", "dr_arjun": "medical"}
MAX_PDF_BYTES = 100 * 1024 * 1024
CHUNK_WORDS = 900


@dataclass
class BookChunk:
    chunk_id: str
    book_id: str
    specialist_id: str
    collection: str
    book_name: str
    chapter: str
    page_start: int
    page_end: int
    content_markdown: str
    source_file: str
    source_sha256: str
    metadata: dict[str, Any] = field(default_factory=dict)


class SpecialistKnowledgeError(ValueError):
    """Raised when a specialist book cannot be safely processed."""


class SpecialistKnowledgeService:
    def __init__(self, storage_dir: Optional[Path] = None) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        self.storage_dir = storage_dir or Path(
            str(repo_root / "database" / "rag_store" / "specialist_books")
        )
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.storage_dir / "manifest.json"
        self.manifest: dict[str, dict[str, Any]] = self._load_manifest()

    def _load_manifest(self) -> dict[str, dict[str, Any]]:
        if not self.manifest_path.exists():
            return {}
        try:
            data = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        return data if isinstance(data, dict) else {}

    def _save_manifest(self) -> None:
        temporary = self.manifest_path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.manifest, indent=2), encoding="utf-8")
        temporary.replace(self.manifest_path)

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()

    @staticmethod
    def _safe_book_id(book_name: str, source_hash: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", book_name.lower()).strip("-")[:60]
        return f"{slug or 'book'}-{source_hash[:12]}"

    def _qdrant(self):
        try:
            from qdrant_client import QdrantClient
        except ImportError as exc:
            raise SpecialistKnowledgeError(
                "qdrant-client is required for specialist book ingestion"
            ) from exc
        url = __import__("os").environ.get("QDRANT_URL")
        if url:
            return QdrantClient(url=url, api_key=__import__("os").environ.get("QDRANT_API_KEY"))
        return QdrantClient(path=str(self.storage_dir / "qdrant"))

    @staticmethod
    def _embedder():
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise SpecialistKnowledgeError(
                "sentence-transformers is required to generate book embeddings"
            ) from exc
        return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    @staticmethod
    def _chapter_for_page(text: str, current: str) -> str:
        for line in text.splitlines()[:20]:
            candidate = " ".join(line.split()).strip()
            if 3 <= len(candidate) <= 120 and (
                re.match(r"^(chapter|part|section)\s+", candidate, re.I)
                or (candidate.isupper() and len(candidate.split()) <= 12)
            ):
                return candidate
        return current

    @staticmethod
    def _table_markdown(page: Any) -> str:
        finder = getattr(page, "find_tables", None)
        if not finder:
            return ""
        try:
            tables = finder().tables
        except Exception:
            return ""
        rendered: list[str] = []
        for table in tables:
            rows = table.extract() or []
            if not rows:
                continue
            clean = [[str(cell or "").replace("|", "\\|").strip() for cell in row] for row in rows]
            width = max(len(row) for row in clean)
            normalized = [row + [""] * (width - len(row)) for row in clean]
            rendered.append("| " + " | ".join(normalized[0]) + " |\n| " + " | ".join(["---"] * width) + " |\n" + "\n".join("| " + " | ".join(row) + " |" for row in normalized[1:]))
        return "\n\n".join(rendered)

    def _extract_chunks(self, pdf_path: Path, book_id: str, book_name: str, source_hash: str, specialist_id: str, collection: str) -> list[BookChunk]:
        try:
            import fitz
        except ImportError as exc:
            raise SpecialistKnowledgeError("PyMuPDF is required to extract PDF content") from exc

        chunks: list[BookChunk] = []
        chapter = "Unclassified"
        with fitz.open(pdf_path) as document:
            for page_number, page in enumerate(document, start=1):
                text = page.get_text("text").strip()
                if not text:
                    continue
                chapter = self._chapter_for_page(text, chapter)
                table = self._table_markdown(page)
                page_markdown = f"## {chapter}\n\n{text}"
                if table:
                    page_markdown += f"\n\n### Table on page {page_number}\n\n{table}"
                words = page_markdown.split()
                for offset in range(0, len(words), CHUNK_WORDS):
                    content = " ".join(words[offset : offset + CHUNK_WORDS]).strip()
                    if len(content) < 40:
                        continue
                    chunk_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{book_id}:{page_number}:{offset}"))
                    chunks.append(BookChunk(
                        chunk_id=chunk_id,
                        book_id=book_id,
                        specialist_id=specialist_id,
                        collection=collection,
                        book_name=book_name,
                        chapter=chapter,
                        page_start=page_number,
                        page_end=page_number,
                        content_markdown=content,
                        source_file=pdf_path.name,
                        source_sha256=source_hash,
                        metadata={"page_number": page_number, "book_name": book_name, "chapter": chapter},
                    ))
        return chunks

    def ingest_pdf(self, pdf_path: Path, specialist_id: str, book_name: Optional[str] = None) -> dict[str, Any]:
        if specialist_id not in SPECIALIST_COLLECTIONS:
            raise SpecialistKnowledgeError("No knowledge collection is assigned to this specialist")
        pdf_path = pdf_path.expanduser().resolve()
        if not pdf_path.is_file() or pdf_path.suffix.lower() != ".pdf":
            raise SpecialistKnowledgeError("A readable PDF file is required")
        if pdf_path.stat().st_size > MAX_PDF_BYTES:
            raise SpecialistKnowledgeError("PDF exceeds the 100 MiB upload limit")

        source_hash = self._sha256(pdf_path)
        duplicate = next((item for item in self.manifest.values() if item.get("source_sha256") == source_hash), None)
        if duplicate:
            raise SpecialistKnowledgeError(f"Book already ingested as {duplicate['book_id']}")

        resolved_name = book_name or pdf_path.stem.replace("_", " ")
        book_id = self._safe_book_id(resolved_name, source_hash)
        collection = SPECIALIST_COLLECTIONS[specialist_id]
        chunks = self._extract_chunks(pdf_path, book_id, resolved_name, source_hash, specialist_id, collection)
        if not chunks:
            raise SpecialistKnowledgeError("No extractable text was found in the PDF")

        book_dir = self.storage_dir / book_id
        book_dir.mkdir(parents=True, exist_ok=False)
        (book_dir / "source.pdf").write_bytes(pdf_path.read_bytes())
        (book_dir / "content.json").write_text(json.dumps([asdict(chunk) for chunk in chunks], indent=2), encoding="utf-8")
        (book_dir / "content.md").write_text("\n\n".join(f"# {resolved_name}\n\n### {chunk.chapter} | page {chunk.page_start}\n\n{chunk.content_markdown}" for chunk in chunks), encoding="utf-8")

        model = self._embedder()
        vectors = model.encode([chunk.content_markdown for chunk in chunks], normalize_embeddings=True).tolist()
        try:
            from qdrant_client.models import Distance, PointStruct, VectorParams
            client = self._qdrant()
            if not client.collection_exists(collection):
                client.create_collection(collection_name=collection, vectors_config=VectorParams(size=len(vectors[0]), distance=Distance.COSINE))
            client.upsert(collection_name=collection, points=[PointStruct(id=chunk.chunk_id, vector=vector, payload=asdict(chunk)) for chunk, vector in zip(chunks, vectors)])
        except Exception:
            shutil.rmtree(book_dir, ignore_errors=True)
            raise

        record = {
            "book_id": book_id,
            "book_name": resolved_name,
            "specialist_id": specialist_id,
            "collection": collection,
            "source_file": pdf_path.name,
            "source_sha256": source_hash,
            "chunk_count": len(chunks),
            "status": "processed",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "artifact_dir": str(book_dir),
        }
        self.manifest[book_id] = record
        self._save_manifest()
        return record

    def list_books(self, specialist_id: Optional[str] = None) -> list[dict[str, Any]]:
        return [item for item in self.manifest.values() if not specialist_id or item.get("specialist_id") == specialist_id]

    def validate_book(self, book_id: str) -> dict[str, Any]:
        record = self.manifest.get(book_id)
        if not record:
            raise SpecialistKnowledgeError("Book not found")
        directory = Path(record["artifact_dir"])
        valid = all((directory / filename).is_file() for filename in ("source.pdf", "content.md", "content.json"))
        return {**record, "valid": valid}

    def delete_book(self, book_id: str) -> dict[str, Any]:
        record = self.manifest.get(book_id)
        if not record:
            raise SpecialistKnowledgeError("Book not found")
        try:
            client = self._qdrant()
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            client.delete(collection_name=record["collection"], points_selector=Filter(must=[FieldCondition(key="book_id", match=MatchValue(value=book_id))]))
        except Exception:
            pass
        shutil.rmtree(Path(record["artifact_dir"]), ignore_errors=True)
        del self.manifest[book_id]
        self._save_manifest()
        return {"deleted": True, "book_id": book_id, "collection": record["collection"]}

    def search(self, query: str, collection: str, top_k: int = 4) -> list[dict[str, Any]]:
        if collection not in set(SPECIALIST_COLLECTIONS.values()):
            return []
        model = self._embedder()
        vector = model.encode([query], normalize_embeddings=True).tolist()[0]
        client = self._qdrant()
        results = client.search(collection_name=collection, query_vector=vector, limit=top_k)
        return [result.payload for result in results if result.payload and result.payload.get("collection") == collection]


specialist_knowledge_service = SpecialistKnowledgeService()
