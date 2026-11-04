"""Bounded, source-restricted PubMed lookup for gaps in the local medical index.

Only de-identified query text is sent to NCBI. This is a supplemental reference
lookup, not a clinical decision system; emergency triage happens before lookup.
"""

from __future__ import annotations

import asyncio
import logging
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
import httpx

logger = logging.getLogger("medicus_care.medical_web_research")

_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
_TIMEOUT = httpx.Timeout(2.0, connect=0.6)
_TOTAL_TIMEOUT_SECONDS = 3.6
_LOOKUP_LIMIT = asyncio.Semaphore(4)


@dataclass(frozen=True)
class MedicalWebReference:
    title: str
    year: str
    abstract: str
    url: str


def _deidentify_query(query: str) -> str:
    """Remove common direct identifiers before sending a search to PubMed."""
    value = re.sub(r"\bmy name is\s+[^,.!?;]+", " ", query, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:i am|i'm)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b", " ", value)
    value = re.sub(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", " ", value)
    value = re.sub(r"(?<!\w)(?:\+?\d[\d ()-]{7,}\d)(?!\w)", " ", value)
    value = re.sub(r"\b(?:my address is|i live at)\s+[^,.!?;]+", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:email|call|text) me at\b.*$", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value).strip(" ,.;:\t\r\n")
    return value[:300]


def _extract_references(xml_text: str, limit: int = 3) -> list[MedicalWebReference]:
    root = ET.fromstring(xml_text)
    references: list[MedicalWebReference] = []
    for article in root.findall(".//PubmedArticle"):
        title_node = article.find(".//ArticleTitle")
        title = " ".join("".join(title_node.itertext()).split()) if title_node is not None else ""
        abstract_parts = [
            " ".join("".join(node.itertext()).split())
            for node in article.findall(".//Abstract/AbstractText")
        ]
        abstract = " ".join(part for part in abstract_parts if part)
        pmid_node = article.find(".//PMID")
        pmid = (pmid_node.text or "").strip() if pmid_node is not None else ""
        year_node = article.find(".//PubDate/Year")
        year = (year_node.text or "").strip() if year_node is not None else ""
        if not year:
            medline_date = article.find(".//PubDate/MedlineDate")
            year_match = re.search(r"\b(19|20)\d{2}\b", medline_date.text or "") if medline_date is not None else None
            year = year_match.group(0) if year_match else "date unavailable"
        if title and abstract and pmid:
            references.append(MedicalWebReference(
                title=title[:500],
                year=year,
                abstract=abstract[:2400],
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            ))
        if len(references) >= limit:
            break
    return references


async def search_pubmed(query: str) -> list[MedicalWebReference]:
    """Search recent peer-reviewed medical literature, failing fast on outages."""
    safe_query = _deidentify_query(query)
    if len(safe_query) < 4:
        return []

    async with _LOOKUP_LIMIT:
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
                async with asyncio.timeout(_TOTAL_TIMEOUT_SECONDS):
                    search = await client.get(
                        f"{_BASE_URL}/esearch.fcgi",
                        params={
                            "db": "pubmed",
                            "term": safe_query,
                            "sort": "relevance",
                            "retmax": "3",
                            "retmode": "json",
                        },
                    )
                    search.raise_for_status()
                    ids = search.json().get("esearchresult", {}).get("idlist", [])
                    if not ids:
                        return []
                    details = await client.get(
                        f"{_BASE_URL}/efetch.fcgi",
                        params={"db": "pubmed", "id": ",".join(ids), "retmode": "xml"},
                    )
                    details.raise_for_status()
                    return _extract_references(details.text)
        except (httpx.HTTPError, ValueError, ET.ParseError, TimeoutError) as exc:
            # Do not log the patient-derived search string or response payload.
            logger.info("PubMed lookup unavailable (%s)", type(exc).__name__)
            return []


def format_references(references: list[MedicalWebReference]) -> str:
    if not references:
        return ""
    lines = [
        "\n\nSupplemental peer-reviewed PubMed references retrieved for this question. "
        "Use only when directly relevant, distinguish study findings from established guidance, "
        "do not diagnose or prescribe, and mention the source title and publication year if useful:\n"
    ]
    for item in references:
        lines.append(
            f"• {item.title} ({item.year}). Abstract: {item.abstract}\n  Source: PubMed {item.url}\n"
        )
    return "".join(lines)
