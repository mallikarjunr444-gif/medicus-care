"""Local, attribution-preserving retrieval over medical and wellness collections.

The current index uses lexical ranking; embeddings are not generated or queried.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

logger = logging.getLogger("medicus_care.rag")

@dataclass
class KnowledgeChunk:
    chunk_id: str
    collection: str  # 'medical' | 'mental_wellness'
    category: str    # 'symptoms', 'diseases', 'first_aid', 'cbt', 'emotional_support', etc.
    title: str
    content: str
    source_name: str
    license: str
    origin_url: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    approved_by_admin: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None

@dataclass
class RetrievalResult:
    chunk_id: str
    collection: str
    category: str
    title: str
    content: str
    source_name: str
    license: str
    similarity_score: float
    origin_url: Optional[str] = None
    attribution_text: str = ""

class UnifiedRAGService:
    """
    Unified RAG Service with dual independent vector collections:
    1. Medical Clinical Knowledge Collection
    2. Mental Wellness Knowledge Collection
    """

    def __init__(self, data_root: Optional[Path] = None, storage_dir: Optional[Path] = None):
        repo_root = Path(__file__).resolve().parents[3]
        self.data_root = data_root or Path(
            os.getenv("MEDICARE_KNOWLEDGE_DATA", str(repo_root / "medicus-ai-data"))
        )
        self.storage_dir = storage_dir or Path(
            os.getenv("MEDICARE_RAG_STORE", str(repo_root / "database" / "rag_store"))
        )
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Dual collection in-memory / persisted index
        self.medical_store: Dict[str, KnowledgeChunk] = {}
        self.mental_wellness_store: Dict[str, KnowledgeChunk] = {}
        self.content_hashes: set[str] = set()

        # Search is lexical, so the expensive part is building the normalized
        # title/content token sets and document-frequency counts.  Keep those
        # derived structures in memory instead of rebuilding them for every
        # patient turn.  The persisted store is still the source of truth.
        self._search_candidates: Dict[str, List[Tuple[KnowledgeChunk, set[str], set[str]]]] = {}
        self._search_document_frequency: Dict[str, Counter[str]] = {}
        self._search_document_counts: Dict[str, int] = {}
        self._search_index_size = -1

        # Quality & Ingestion Tracking
        self.ingestion_stats = {
            "total_documents_parsed": 0,
            "total_chunks_indexed": 0,
            "duplicates_filtered": 0,
            "medical_chunks_count": 0,
            "mental_wellness_chunks_count": 0,
            "last_indexed_at": None,
        }

        self._load_local_store()
        self._rebuild_search_index()

    def _hash_text(self, text: str) -> str:
        clean = re.sub(r"\s+", " ", text.lower().strip())
        return hashlib.sha256(clean.encode("utf-8")).hexdigest()

    @staticmethod
    def _normalize_search_token(token: str) -> str:
        """Normalize the small amount of morphology used by lexical search."""
        if token == "anxious":
            return "anxiety"
        if token == "worried":
            return "worry"
        if token.endswith("ies") and len(token) > 4:
            return token[:-3] + "y"
        if token.endswith("ing") and len(token) > 5:
            token = token[:-3]
            if len(token) > 2 and token[-1] == token[-2]:
                token = token[:-1]
            return token
        if token.endswith("ed") and len(token) > 4:
            return token[:-2]
        if token.endswith("s") and len(token) > 4:
            return token[:-1]
        return token

    @classmethod
    def _search_tokens(cls, text: str) -> set[str]:
        stopwords = {
            "what", "when", "where", "which", "about", "have", "with", "from",
            "that", "this", "does", "your", "you", "are", "for", "the", "and",
            "how", "can", "tell", "please",
        }
        return {
            cls._normalize_search_token(token)
            for token in re.findall(r"\w+", text.lower())
            if len(token) > 2 and token not in stopwords
        }

    def _rebuild_search_index(self) -> None:
        """Build the in-memory lexical index once per store change."""
        candidates: Dict[str, List[Tuple[KnowledgeChunk, set[str], set[str]]]] = {
            "medical": [],
            "mental_wellness": [],
            "all": [],
        }
        document_frequency: Dict[str, Counter[str]] = {
            "medical": Counter(),
            "mental_wellness": Counter(),
            "all": Counter(),
        }

        for collection, store in (
            ("medical", self.medical_store),
            ("mental_wellness", self.mental_wellness_store),
        ):
            for chunk in store.values():
                if not chunk.approved_by_admin:
                    continue
                entry = (
                    chunk,
                    self._search_tokens(chunk.title),
                    self._search_tokens(chunk.content),
                )
                candidates[collection].append(entry)
                candidates["all"].append(entry)
                matched_terms = entry[1] | entry[2]
                document_frequency[collection].update(matched_terms)
                document_frequency["all"].update(matched_terms)

        self._search_candidates = candidates
        self._search_document_frequency = document_frequency
        self._search_document_counts = {
            scope: len(entries) for scope, entries in candidates.items()
        }
        self._search_index_size = len(self.medical_store) + len(self.mental_wellness_store)

    def _ensure_search_index(self) -> None:
        # The admin path rebuilds on persist().  This size check also keeps the
        # service correct for callers/tests that add a chunk directly.
        current_size = len(self.medical_store) + len(self.mental_wellness_store)
        if current_size != self._search_index_size:
            self._rebuild_search_index()

    def _load_local_store(self):
        """Load persisted indexed chunks if present."""
        med_file = self.storage_dir / "medical_index.json"
        psy_file = self.storage_dir / "mental_wellness_index.json"

        if med_file.exists():
            try:
                with open(med_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        chunk = KnowledgeChunk(**item)
                        self.medical_store[chunk.chunk_id] = chunk
                        self.content_hashes.add(self._hash_text(chunk.content))
                self.ingestion_stats["medical_chunks_count"] = len(self.medical_store)
            except Exception as e:
                logger.warning(f"Could not load medical_index.json: {e}")

        if psy_file.exists():
            try:
                with open(psy_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        chunk = KnowledgeChunk(**item)
                        self.mental_wellness_store[chunk.chunk_id] = chunk
                        self.content_hashes.add(self._hash_text(chunk.content))
                self.ingestion_stats["mental_wellness_chunks_count"] = len(self.mental_wellness_store)
            except Exception as e:
                logger.warning(f"Could not load mental_wellness_index.json: {e}")

        self.ingestion_stats["total_chunks_indexed"] = (
            len(self.medical_store) + len(self.mental_wellness_store)
        )

    def persist(self):
        """Save chunk collections to disk."""
        med_file = self.storage_dir / "medical_index.json"
        psy_file = self.storage_dir / "mental_wellness_index.json"

        with open(med_file, "w", encoding="utf-8") as f:
            json.dump([asdict(c) for c in self.medical_store.values()], f, indent=2)

        with open(psy_file, "w", encoding="utf-8") as f:
            json.dump([asdict(c) for c in self.mental_wellness_store.values()], f, indent=2)

        self.ingestion_stats["last_indexed_at"] = datetime.utcnow().isoformat()
        self._rebuild_search_index()
        logger.info(
            f"RAG store persisted: {len(self.medical_store)} medical chunks, "
            f"{len(self.mental_wellness_store)} mental wellness chunks."
        )

    # ── Ingestion Handlers ──────────────────────────────────────────────────

    def ingest_medquad(self, max_records: int = 500) -> int:
        """Rebuild MedQuAD Q&A from its CC BY 4.0 XML source.

        Copyright-emptied ADAM and drug-information subsets are excluded.
        Stable identifiers make repeated ingestion idempotent.
        """
        mq_dir = self.data_root / "MedQuAD"
        if not mq_dir.exists():
            return 0

        # Prioritize folders with 100% verified non-empty clinical text answers
        valid_folders = [
            "4_MPlus_Health_Topics_QA",
            "8_NHLBI_QA_XML",
            "9_CDC_QA",
            "5_NIDDK_QA",
            "6_NINDS_QA",
            "1_CancerGov_QA",
            "7_SeniorHealth_QA",
            "3_GHR_QA",
            "2_GARD_QA",
        ]

        xml_files = []
        for folder_name in valid_folders:
            sub = mq_dir / folder_name
            if sub.exists():
                xml_files.extend(sorted(list(sub.glob("*.xml"))))

        # Replace earlier MedQuAD imports to avoid stale attribution and IDs.
        for chunk_id in list(self.medical_store):
            if chunk_id.startswith("MQ-"):
                del self.medical_store[chunk_id]
        self.content_hashes = {
            self._hash_text(chunk.content)
            for store in (self.medical_store, self.mental_wellness_store)
            for chunk in store.values()
        }

        ingested = 0

        for xml_path in xml_files:
            if ingested >= max_records:
                break
            try:
                tree = ET.parse(xml_path)
                root = tree.getroot()
                focus = root.findtext(".//Focus") or "General Health"
                origin_url = root.attrib.get("url") or None
                
                # Check for Q&A pairs
                for qa in root.findall(".//QAPair"):
                    if ingested >= max_records:
                        break
                    q = qa.findtext("Question")
                    a = qa.findtext("Answer")

                    if not q or not a or len(a.strip()) < 30:
                        continue

                    content = f"Question: {q.strip()}\n\nClinical Guidance: {a.strip()}"
                    h = self._hash_text(content)
                    if h in self.content_hashes:
                        self.ingestion_stats["duplicates_filtered"] += 1
                        continue

                    stable_key = hashlib.sha256(content.encode("utf-8")).hexdigest()[:20]
                    chunk_id = f"MQ-{xml_path.stem}-{stable_key}"
                    # Classify category
                    q_lower = q.lower()
                    if any(k in q_lower for k in ["symptom", "sign", "feel"]):
                        cat = "symptoms"
                    elif any(k in q_lower for k in ["cause", "etiology", "risk"]):
                        cat = "diseases"
                    elif any(k in q_lower for k in ["prevent", "diet", "lifestyle"]):
                        cat = "preventive_healthcare"
                    elif any(k in q_lower for k in ["test", "diagnos", "exam"]):
                        cat = "laboratory_reports"
                    elif any(k in q_lower for k in ["emergency", "first aid", "urgent"]):
                        cat = "first_aid"
                    else:
                        cat = "general_health_education"

                    chunk = KnowledgeChunk(
                        chunk_id=chunk_id,
                        collection="medical",
                        category=cat,
                        title=f"{focus}: {q[:80]}",
                        content=content,
                        source_name="MedQuAD dataset (Asma Ben Abacha; NIH source collection)",
                        license="CC BY 4.0",
                        origin_url=origin_url,
                        metadata={"focus": focus, "file": xml_path.name, "folder": xml_path.parent.name}
                    )
                    self.medical_store[chunk_id] = chunk
                    self.content_hashes.add(h)
                    ingested += 1

            except Exception as e:
                continue

        self.ingestion_stats["medical_chunks_count"] = len(self.medical_store)
        self.persist()
        return ingested

    def ingest_esconv(self, max_dialogues: int = 150) -> int:
        """Extract emotional support strategies and dialogues from ESConv."""
        es_path = self.data_root / "Emotional-Support-Conversation" / "ESConv.json"
        if not es_path.exists():
            return 0

        with open(es_path, "r", encoding="utf-8") as f:
            dialogues = json.load(f)

        ingested = 0
        for i, d in enumerate(dialogues[:max_dialogues]):
            emotion = d.get("emotion_type", "stress")
            problem = d.get("problem_type", "everyday_pressure")
            situation = d.get("situation", "")
            turns = d.get("dialog", [])

            # Extract supporter interventions
            supporter_turns = [
                turn["content"].strip()
                for turn in turns
                if turn.get("speaker") == "supporter" and len(turn.get("content", "").strip()) > 40
            ]

            if not supporter_turns:
                continue

            content = (
                f"Client Situation: {situation}\n\n"
                f"Identified Emotion: {emotion} | Context: {problem}\n\n"
                f"Effective Supportive Interventions:\n" +
                "\n".join(f"- {st}" for st in supporter_turns[:4])
            )

            h = self._hash_text(content)
            if h in self.content_hashes:
                self.ingestion_stats["duplicates_filtered"] += 1
                continue

            chunk_id = f"ESC-{i:04d}"
            cat = "stress_management" if "work" in problem.lower() or "job" in problem.lower() else "emotional_support"
            
            chunk = KnowledgeChunk(
                chunk_id=chunk_id,
                collection="mental_wellness",
                category=cat,
                title=f"Supportive Strategy for {emotion.capitalize()} ({problem})",
                content=content,
                source_name="Emotional Support Conversation (ESConv)",
                license="Apache 2.0",
                origin_url="https://github.com/thu-coai/Emotional-Support-Conversation",
                metadata={"emotion": emotion, "problem": problem}
            )
            self.mental_wellness_store[chunk_id] = chunk
            self.content_hashes.add(h)
            ingested += 1

        self.ingestion_stats["mental_wellness_chunks_count"] = len(self.mental_wellness_store)
        self.persist()
        return ingested

    def ingest_cactus_and_psy_insight(self) -> int:
        """Ingest CBT educational prompts from CACTUS and Psy-Insight."""
        cactus_dir = self.data_root / "cactus" / "prompts"
        ingested = 0

        if cactus_dir.exists():
            for txt_file in cactus_dir.glob("*.txt"):
                try:
                    text = txt_file.read_text(encoding="utf-8").strip()
                    if len(text) < 50:
                        continue
                    h = self._hash_text(text)
                    if h in self.content_hashes:
                        continue
                    chunk_id = f"CAC-{txt_file.stem}"
                    chunk = KnowledgeChunk(
                        chunk_id=chunk_id,
                        collection="mental_wellness",
                        category="cbt_educational_exercises",
                        title=f"CBT Protocol: {txt_file.stem.replace('_', ' ').title()}",
                        content=text,
                        source_name="CACTUS CBT Framework",
                        license="MIT License",
                        origin_url="https://github.com/coding-groot/cactus",
                        metadata={"file": txt_file.name}
                    )
                    self.mental_wellness_store[chunk_id] = chunk
                    self.content_hashes.add(h)
                    ingested += 1
                except Exception:
                    continue

        self.persist()
        return ingested

    def ingest_mental_wellness_qa(
        self,
        records: Iterable[Dict[str, Any]],
        *,
        source_name: str,
        license_name: str,
        origin_url: str,
        dataset_id: str,
        max_records: int = 2_000,
    ) -> int:
        """Stage external mental-wellness Q&A records for admin review.

        These records are deliberately not patient-visible until an admin
        explicitly approves them. Stable IDs and content hashes make repeated
        imports safe and idempotent.
        """
        if max_records < 1:
            raise ValueError("max_records must be at least 1")

        dataset_slug = re.sub(r"[^a-z0-9]+", "-", dataset_id.lower()).strip("-")[:40]
        ingested = 0
        for record in records:
            if ingested >= max_records:
                break
            if not isinstance(record, dict):
                continue

            question = str(record.get("question") or "").strip()
            answer = str(record.get("answer") or "").strip()
            if len(question) < 8 or len(answer) < 20:
                continue

            content = f"Question: {question}\n\nReference response (unreviewed): {answer}"
            if len(content) > 15_000:
                continue

            content_hash = self._hash_text(content)
            if content_hash in self.content_hashes:
                self.ingestion_stats["duplicates_filtered"] += 1
                continue

            stable_key = hashlib.sha256(
                f"{dataset_id}\n{content}".encode("utf-8")
            ).hexdigest()[:20]
            chunk_id = f"EXT-{dataset_slug}-{stable_key}"
            chunk = KnowledgeChunk(
                chunk_id=chunk_id,
                collection="mental_wellness",
                category="emotional_support",
                title=f"Unreviewed mental-wellness example: {question[:100]}",
                content=content,
                source_name=source_name,
                license=license_name,
                origin_url=origin_url,
                approved_by_admin=False,
                metadata={
                    "dataset_id": dataset_id,
                    "record_id": str(record.get("record_id") or ""),
                    "source_file": str(record.get("source_file") or ""),
                    "review_required": True,
                    "review_note": (
                        "External dialogue example; not verified as clinical guidance. "
                        "Review for safety, privacy, provenance, and licensing before approval."
                    ),
                },
            )
            self.mental_wellness_store[chunk_id] = chunk
            self.content_hashes.add(content_hash)
            ingested += 1

        self.ingestion_stats["mental_wellness_chunks_count"] = len(self.mental_wellness_store)
        self.ingestion_stats["total_chunks_indexed"] = (
            len(self.medical_store) + len(self.mental_wellness_store)
        )
        self.persist()
        return ingested

    # ── Semantic Retrieval Engine ───────────────────────────────────────────

    def search(
        self,
        query: str,
        collection: str = "medical",
        category: Optional[str] = None,
        top_k: int = 3,
        threshold: float = 0.35
    ) -> List[RetrievalResult]:
        """
        Query the targeted collection using lexical relevance scoring.
        Appends mandatory source attribution and license metadata.
        """
        if collection == "both":
            collection = "all"
        if collection not in {"medical", "mental_wellness", "all"}:
            raise ValueError(f"Unknown knowledge collection: {collection}")
        self._ensure_search_index()
        query_terms = self._search_tokens(query)
        mental_intent = bool(
            query_terms
            & {"stress", "anxiety", "worry", "sadness", "depression", "lonely", "mindful", "overwhelm"}
        )
        indexed_candidates = self._search_candidates[collection]
        candidates = (
            [entry for entry in indexed_candidates if entry[0].category == category]
            if category
            else indexed_candidates
        )

        if category:
            document_frequency: Counter[str] = Counter()
            for _, title_words, content_words in candidates:
                document_frequency.update(query_terms.intersection(title_words | content_words))
            document_count = max(1, len(candidates))
        else:
            document_frequency = self._search_document_frequency[collection]
            document_count = max(1, self._search_document_counts[collection])

        term_weights = {
            term: 1.0 + (document_count / (1 + document_frequency[term])) ** 0.5
            for term in query_terms
        }
        max_score = sum(weight * 3.0 for weight in term_weights.values()) or 1.0
        results: List[Tuple[float, KnowledgeChunk]] = []
        for chunk, title_words, content_words in candidates:
            score = sum(
                term_weights[term] * (3.0 if term in title_words else 1.0)
                for term in query_terms
                if term in title_words or term in content_words
            ) / max_score
            if mental_intent and chunk.collection == "mental_wellness":
                score = min(1.0, score * 1.7)
            if score >= threshold:
                results.append((score, chunk))

        # Sort descending by score
        results.sort(key=lambda x: x[0], reverse=True)

        final_results: List[RetrievalResult] = []
        for score, chunk in results[:top_k]:
            attr = f"Source: {chunk.source_name} | License: {chunk.license}"
            if chunk.origin_url:
                attr += f" | URL: {chunk.origin_url}"

            final_results.append(
                RetrievalResult(
                    chunk_id=chunk.chunk_id,
                    collection=chunk.collection,
                    category=chunk.category,
                    title=chunk.title,
                    content=chunk.content,
                    source_name=chunk.source_name,
                    license=chunk.license,
                    similarity_score=round(score, 3),
                    origin_url=chunk.origin_url,
                    attribution_text=attr
                )
            )

        return final_results

    def search_for_doctor(
        self,
        query: str,
        doctor_id: Optional[str],
        *,
        top_k: int = 4,
        threshold: float = 0.35,
    ) -> List[RetrievalResult]:
        """Route Dr. Ananya to wellness-only knowledge; other doctors search both."""
        collection = "mental_wellness" if doctor_id == "dr_ananya" else "all"
        return self.search(
            query,
            collection=collection,
            top_k=top_k,
            threshold=threshold,
        )

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_chunks": len(self.medical_store) + len(self.mental_wellness_store),
            "medical_chunks": len(self.medical_store),
            "mental_wellness_chunks": len(self.mental_wellness_store),
            "duplicates_filtered": self.ingestion_stats["duplicates_filtered"],
            "storage_path": str(self.storage_dir),
            "approved_chunks": sum(1 for c in self.medical_store.values() if c.approved_by_admin) +
                               sum(1 for c in self.mental_wellness_store.values() if c.approved_by_admin)
        }

rag_service = UnifiedRAGService()
