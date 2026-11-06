import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ingest_mental_wellness import iter_source_records, to_qa_record


def test_importer_reads_kaggle_json_zip_and_extracts_context_response(tmp_path):
    archive_path = tmp_path / "dataset.zip"
    payload = [{"Context": "I feel anxious before exams.", "Response": "Try identifying what feels most stressful and choose one small study step."}]
    with zipfile.ZipFile(archive_path, "w") as archive:
        archive.writestr("combined_dataset.json", json.dumps(payload))

    rows = list(iter_source_records(archive_path))
    assert len(rows) == 1
    record = to_qa_record(rows[0][0], rows[0][1], 1)
    assert record["question"] == payload[0]["Context"]
    assert record["answer"] == payload[0]["Response"]
    assert record["source_file"] == "combined_dataset.json"


def test_importer_ignores_non_dialogue_rows():
    row = {"text": "I feel anxious today", "label": "anxiety"}
    assert to_qa_record(row, "labels.csv", 3) is None
