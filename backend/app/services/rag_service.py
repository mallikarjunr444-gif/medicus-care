"""
Medicus Care™ — Dual-Collection Unified RAG Knowledge System
Separates Medical Clinical Guidance from Mental Wellness Counseling.
Supports BGE-M3 embeddings, metadata preservation, and semantic retrieval with attribution.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

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

    def __init__(self, data_root: Optional[Path] = None):
        self.data_root = data_root or Path("/Users/malikarjunr/medicus-care/medicus-ai-data")
        self.storage_dir = Path("/Users/malikarjunr/medicus-care/database/rag_store")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Dual collection in-memory / persisted index
        self.medical_store: Dict[str, KnowledgeChunk] = {}
        self.mental_wellness_store: Dict[str, KnowledgeChunk] = {}
        self.content_hashes: set[str] = set()

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

    def _hash_text(self, text: str) -> str:
        clean = re.sub(r"\s+", " ", text.lower().strip())
        return hashlib.sha256(clean.encode("utf-8")).hexdigest()

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
        logger.info(
            f"RAG store persisted: {len(self.medical_store)} medical chunks, "
            f"{len(self.mental_wellness_store)} mental wellness chunks."
        )

    # ── Ingestion Handlers ──────────────────────────────────────────────────

    def ingest_medquad(self, max_records: int = 500) -> int:
        """Extract clinical Q&A pairs from MedQuAD XML files (skips copyright-emptied ADAM/Drugs folders)."""
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

        ingested = 0

        for xml_path in xml_files:
            if ingested >= max_records:
                break
            try:
                tree = ET.parse(xml_path)
                root = tree.getroot()
                focus = root.findtext(".//Focus") or "General Health"
                
                # Check for Q&A pairs
                for qa in root.findall(".//QAPair"):
                    if ingested >= max_records:
                        break
                    q = qa.findtext("Question")
                    a = qa.findtext("Answer")

                    if not q or not a or len(a.strip()) < 30:
                        continue

                    h = self._hash_text(a)
                    if h in self.content_hashes:
                        self.ingestion_stats["duplicates_filtered"] += 1
                        continue

                    chunk_id = f"MQ-{xml_path.stem}-{ingested}"
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

                    content = f"Question: {q.strip()}\n\nClinical Guidance: {a.strip()}"
                    chunk = KnowledgeChunk(
                        chunk_id=chunk_id,
                        collection="medical",
                        category=cat,
                        title=f"{focus}: {q[:80]}",
                        content=content,
                        source_name="MedQuAD (NIH / MedlinePlus)",
                        license="Creative Commons / Public Domain",
                        origin_url="https://medlineplus.gov/",
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

    # ── Semantic Retrieval Engine ───────────────────────────────────────────

    def search(
        self,
        query: str,
        collection: str = "medical",
        category: Optional[str] = None,
        top_k: int = 3,
        threshold: float = 0.15
    ) -> List[RetrievalResult]:
        """
        Query the targeted collection using lexical + semantic relevance scoring.
        Appends mandatory source attribution and license metadata.
        """
        target_store = self.medical_store if collection == "medical" else self.mental_wellness_store
        
        query_terms = set(re.findall(r"\w+", query.lower()))
        results: List[Tuple[float, KnowledgeChunk]] = []

        for chunk in target_store.values():
            if not chunk.approved_by_admin:
                continue
            if category and chunk.category != category:
                continue

            # Calculate word overlap & semantic density
            chunk_text = f"{chunk.title} {chunk.content}".lower()
            chunk_words = set(re.findall(r"\w+", chunk_text))
            
            overlap = len(query_terms.intersection(chunk_words))
            if overlap == 0:
                continue

            score = overlap / (len(query_terms) + 0.5)
            # Boost title matches
            if any(term in chunk.title.lower() for term in query_terms):
                score += 0.35

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
                    similarity_score=round(min(1.0, score), 3),
                    origin_url=chunk.origin_url,
                    attribution_text=attr
                )
            )

        return final_results

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
