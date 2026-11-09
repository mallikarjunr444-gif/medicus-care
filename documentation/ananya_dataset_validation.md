# Dr. Ananya Dataset Validation

Validated 2026-11-09 for the existing `mental_wellness` collection.

## Active Production Data

| Dataset | Payload | License | Status | Use |
| --- | --- | --- | --- | --- |
| ESConv | Local JSON; 150 indexed records | Apache 2.0 in the project inventory | Active | `type: counselling_example` |
| CACTUS | Local CBT records; 19 indexed records | MIT License | Active | `type: cbt_dialogue` |
| MIT 9.00SC Introduction to Psychology | Local PDF; 798 embedded chunks | Local book source; administrator-ingested | Active | `type: psychology_knowledge`, with book/chapter/page metadata |

## Pending or Blocked

| Dataset | Finding | Decision |
| --- | --- | --- |
| KokoroChat | 6,589 JSON dialogues are present. License is CC BY-NC-ND 4.0. Embeddings and other transformations may create derivative material, and commercial use is prohibited. | Do not ingest into patient retrieval without written rights review. |
| EmpatheticDialogues | The cloned repository contains code and loaders, but no actual conversation payload. The inventory identifies CC-BY-NC 4.0/non-commercial terms. | Await the licensed dataset archive, then stage for review. |
| Psy-Insight | Repository contains code, notebooks, and examples, but no clearly declared production-data license for the full source. | Keep research-only until provenance and license are confirmed. |
| PsyDial | The cloned repository contains README/LICENSE and analysis code but no usable conversation payload. | Await the dataset payload and license confirmation. |
| IndieMH | Hugging Face access is gated. Its card restricts use to non-commercial academic research and explicitly prohibits clinical, diagnostic, or therapeutic application. | Never connect to patient-facing Ananya retrieval. |
| Mental Health Counseling Conversations (Amod) | Hugging Face access is gated. RAIL-D prohibits modifying records and adds commercial donation/notice requirements. | Await authorized download and legal approval; preserve records unmodified. |
| RealCBT | SIGdial is a catalog/resource page, not a dataset download, and does not establish a license for a specific corpus. | Identify the exact corpus and license before ingestion. |
| Convokit Emotional Support Corpus | Provides a downloadable ESConv-derived corpus under CC BY-NC 4.0. It duplicates the active ESConv source and adds non-commercial restrictions. | Do not duplicate it into production. |

## Policy

All active Ananya retrieval remains isolated to `mental_wellness`. Pending sources are not patient-visible, are not used as model training data, and must pass provenance, privacy, safety, and license review before administrator approval. Catalogs and implementation repositories are research references, not knowledge records.
