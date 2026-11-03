# MediCare doctor knowledge

Both Dr. Ananya and Dr. Smit use the same retrieval-augmented knowledge
service during consultation. Their name, specialty, and voice remain persona
settings; they do not select separate medical knowledge collections.

## Current architecture

- PostgreSQL stores MediCare application records such as users, avatars,
  consultations, and messages.
- The approved medical and wellness reference index is persisted in
  `database/rag_store/*.json` and loaded by the backend retrieval service.
- Chat turns search both approved collections and include matched excerpts
  with source attribution in the model context. Kannada search text is
  translated locally for retrieval when possible; the reply stays in the
  patient's selected language.
- Retrieval currently uses lexical matching. No embedding model or model
  fine-tuning is active. This is retrieval-augmented generation (RAG), not
  training a medical model.

## Indexed sources

The medical collection is built from eligible question-and-answer entries in
the MedQuAD XML source folders. The importer skips the MedlinePlus ADAM and
drug/herbal subsets whose answers were removed for copyright reasons. Each
record keeps its MedQuAD ID, source URL, and CC BY 4.0 attribution. The dataset
README reports 47,457 total entries across all subsets; the selected eligible
folders contain 16,405 non-empty answers, of which 16,357 unique Q&A entries
are currently indexed after duplicate removal.

The wellness collection retains the existing ESConv and CACTUS materials for
supportive communication patterns. They are not treated as authoritative
clinical guidance. Uploaded documents remain unapproved until reviewed.

## Safety and limits

These references can be incomplete or out of date and do not replace current
clinical guidance, a clinician's examination, or emergency services. The
doctor personas must not claim to be human clinicians, invent credentials or
personal histories, diagnose, or prescribe. Medical citations are included in
the model context so replies can identify their source when relevant.

## Rebuild

Use the existing admin endpoint `POST /api/v1/admin/knowledge/reindex` to
rebuild the selected MedQuAD entries and refresh the smaller wellness sources.
The index location can be changed with `MEDICARE_RAG_STORE`; the source data
location can be changed with `MEDICARE_KNOWLEDGE_DATA`.

MedQuAD attribution: Asma Ben Abacha and Dina Demner-Fushman, “A Question-
Entailment Approach to Question Answering,” BMC Bioinformatics (2019),
https://github.com/abachaa/MedQuAD. License: CC BY 4.0,
https://creativecommons.org/licenses/by/4.0/.
