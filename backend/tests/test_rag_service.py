import xml.etree.ElementTree as ET

from app.services.rag_service import KnowledgeChunk, UnifiedRAGService


def test_medquad_import_keeps_source_url_license_and_stable_ids(tmp_path):
    data_root = tmp_path / "data"
    source_dir = data_root / "MedQuAD" / "4_MPlus_Health_Topics_QA"
    source_dir.mkdir(parents=True)
    root = ET.Element(
        "Document",
        {"id": "test-1", "source": "MPlusHealthTopics", "url": "https://example.org/topic"},
    )
    ET.SubElement(root, "Focus").text = "A1C"
    pairs = ET.SubElement(root, "QAPairs")
    pair = ET.SubElement(pairs, "QAPair")
    ET.SubElement(pair, "Question").text = "What does A1C measure?"
    ET.SubElement(pair, "Answer").text = "A1C measures average blood glucose over about three months. " * 2
    ET.ElementTree(root).write(source_dir / "test-1.xml", encoding="utf-8", xml_declaration=True)

    service = UnifiedRAGService(data_root=data_root, storage_dir=tmp_path / "index")

    assert service.ingest_medquad(max_records=10) == 1
    first_id = next(iter(service.medical_store))
    chunk = service.medical_store[first_id]
    assert chunk.origin_url == "https://example.org/topic"
    assert chunk.license == "CC BY 4.0"

    assert service.ingest_medquad(max_records=10) == 1
    assert list(service.medical_store) == [first_id]


def test_search_all_returns_both_approved_collections(tmp_path):
    service = UnifiedRAGService(data_root=tmp_path, storage_dir=tmp_path / "index")
    service.medical_store["med"] = KnowledgeChunk(
        chunk_id="med",
        collection="medical",
        category="general_health_education",
        title="Diabetes guidance",
        content="Diabetes blood glucose guidance",
        source_name="MedQuAD",
        license="CC BY 4.0",
    )
    service.mental_wellness_store["well"] = KnowledgeChunk(
        chunk_id="well",
        collection="mental_wellness",
        category="stress_management",
        title="Diabetes stress support",
        content="Diabetes stress support conversation",
        source_name="ESConv",
        license="Apache 2.0",
    )

    results = service.search("diabetes stress", collection="all", top_k=5)
    assert {result.collection for result in results} == {"medical", "mental_wellness"}
    assert results[0].collection == "mental_wellness"


def test_external_wellness_records_are_pending_review_and_idempotent(tmp_path):
    service = UnifiedRAGService(data_root=tmp_path, storage_dir=tmp_path / "index")
    record = {
        "question": "I feel overwhelmed by work lately.",
        "answer": "It may help to identify one manageable next step and take a short break.",
        "record_id": "row-1",
        "source_file": "conversations.csv",
    }

    options = {
        "source_name": "Example conversations",
        "license_name": "MIT",
        "origin_url": "https://example.org/dataset",
        "dataset_id": "example/mental-wellness",
    }
    assert service.ingest_mental_wellness_qa([record], **options) == 1
    chunk = next(iter(service.mental_wellness_store.values()))
    assert chunk.approved_by_admin is False
    assert chunk.metadata["review_required"] is True
    assert chunk.metadata["record_id"] == "row-1"
    assert service.search("overwhelmed work", collection="mental_wellness") == []

    reloaded = UnifiedRAGService(data_root=tmp_path, storage_dir=tmp_path / "index")
    assert reloaded.ingest_mental_wellness_qa([record], **options) == 0
    assert len(reloaded.mental_wellness_store) == 1
